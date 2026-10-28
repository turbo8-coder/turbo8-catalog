"""One content-addressed cover namespace for curated and reviewed cartridges."""
import hashlib
import json
import re
import struct
import tempfile
import urllib.request
import zlib
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

REPO = 'turbo8-coder/turbo8-catalog'
TAG = 'online-covers-v1'
MAX_BYTES = 128 * 1024
SIZE = (256, 144)


def require(value, message):
    if not value:
        raise ValueError(message)


def png_size(raw):
    require(len(raw) >= 33 and raw[:8] == b'\x89PNG\r\n\x1a\n' and raw[12:16] == b'IHDR', 'Invalid PNG header')
    offset = 8
    ended = False
    while offset + 12 <= len(raw):
        size = struct.unpack('>I', raw[offset:offset + 4])[0]
        require(offset + size + 12 <= len(raw), 'Truncated PNG chunk')
        chunk = raw[offset + 4:offset + 8 + size]
        crc = struct.unpack('>I', raw[offset + 8 + size:offset + 12 + size])[0]
        require(zlib.crc32(chunk) & 0xffffffff == crc, 'PNG checksum mismatch')
        offset += size + 12
        if chunk[:4] == b'IEND':
            ended = True
            break
    require(ended and offset == len(raw), 'Invalid PNG ending')
    return struct.unpack('>II', raw[16:24])


def optimize(raw):
    """Recompress IDAT losslessly; dimensions, filters and pixels stay unchanged."""
    require(24 <= len(raw) <= MAX_BYTES and png_size(raw) == SIZE, 'Invalid catalog cover')
    chunks = []
    position = 8
    compressed = bytearray()
    while position < len(raw):
        size = struct.unpack('>I', raw[position:position + 4])[0]
        chunk = raw[position:position + size + 12]
        require(len(chunk) == size + 12, 'Truncated cover chunk')
        kind = chunk[4:8]
        if kind == b'IDAT':
            compressed.extend(chunk[8:-4])
        chunks.append((kind, chunk))
        position += len(chunk)
    decoder = zlib.decompressobj()
    pixels = decoder.decompress(bytes(compressed), 512 * 1024 + 1)
    require(len(pixels) <= 512 * 1024 and decoder.eof and not decoder.unused_data,
            'Invalid or oversized cover pixels')
    data = b'IDAT' + zlib.compress(pixels, 9)
    idat = struct.pack('>I', len(data) - 4) + data + struct.pack('>I', zlib.crc32(data) & 0xffffffff)
    result = bytearray(raw[:8])
    written = False
    for kind, chunk in chunks:
        if kind == b'IDAT':
            if not written:
                result.extend(idat)
                written = True
        else:
            result.extend(chunk)
    return bytes(result) if len(result) < len(raw) else raw


def generate(entries, output):
    """Migrate every existing entry and generate the same metadata on every build."""
    covers = {}
    original_size = 0
    for entry in entries:
        cart_id = entry['id']
        require(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{0,95}', cart_id) and '..' not in cart_id,
                'Invalid cover ID')
        source = output / 'covers' / (cart_id + '.png')
        require(source.is_file() and not source.is_symlink(), 'Missing cover: ' + cart_id)
        raw = source.read_bytes()
        original_size += len(raw)
        thumbnail = optimize(raw)
        digest = hashlib.sha256(thumbnail).hexdigest()
        relative = 'covers/' + digest + '.png'
        (output / relative).write_bytes(thumbnail)
        entry['cover'] = {'path': relative, 'sha256': digest, 'bytes': len(thumbnail),
                          'width': SIZE[0], 'height': SIZE[1]}
        covers[digest + '.png'] = thumbnail
        # Keep covers/<id>.png untouched for clients through v0.2.35.
    print(f'Unified {len(entries)} covers: {original_size} -> '
          f'{sum(e["cover"]["bytes"] for e in entries)} lossless thumbnail bytes.')
    return covers


def publish(covers, commit, gh):
    """An append-only Release mirrors the exact same hash-addressed PNGs."""
    release = None
    for page in range(1, 1001):
        rows = json.loads(gh('api', f'repos/{REPO}/releases?per_page=100&page={page}'))
        require(isinstance(rows, list), 'Cannot read cover Release state')
        release = next((r for r in rows if r['tag_name'] == TAG), None)
        if release is not None or len(rows) < 100:
            break
    else:
        raise ValueError('Cover Release listing exceeds limit')
    if release is None:
        release = json.loads(gh('api', '--method', 'POST', f'repos/{REPO}/releases',
                                '-f', 'tag_name=' + TAG, '-f', 'target_commitish=' + commit,
                                '-f', 'name=Turbo8 Online cover thumbnails',
                                '-f', 'body=Lossless, content-addressed cover download mirror. Existing assets are immutable.',
                                '-F', 'draft=true', '-f', 'make_latest=false'))
    require(type(release.get('id')) is int and release['id'] > 0 and release.get('tag_name') == TAG,
            'Invalid cover Release')
    assets = {a['name']: a for a in release.get('assets', [])}
    with tempfile.TemporaryDirectory(prefix='turbo8-cover-assets-') as tmp:
        missing = []
        for name, raw in covers.items():
            require(name == hashlib.sha256(raw).hexdigest() + '.png', 'Cover asset hash mismatch')
            if name not in assets:
                path = Path(tmp) / name
                path.write_bytes(raw)
                missing.append(str(path))
        # Never use --clobber, even when recovering an interrupted publication.
        for offset in range(0, len(missing), 50):
            gh('release', 'upload', TAG, *missing[offset:offset + 50], '--repo', REPO)
    fresh = json.loads(gh('api', f'repos/{REPO}/releases/{release["id"]}'))
    assets = {a['name']: a for a in fresh['assets']}
    for name, raw in covers.items():
        asset = assets.get(name, {})
        require(asset.get('size') == len(raw) and
                asset.get('digest') == 'sha256:' + hashlib.sha256(raw).hexdigest(),
                'Cover mirror asset failed size/SHA-256 verification: ' + name)
    if fresh['draft']:
        gh('api', '--method', 'PATCH', f'repos/{REPO}/releases/{release["id"]}',
           '-F', 'draft=false', '-f', 'make_latest=false')


def publish_catalog(raw, gh):
    """Mirror the generated directory; curated docs/ is only a build input.

    Unlike hash-named PNGs, this one JSON asset tracks the latest publication.
    The catalog publication concurrency lock serializes updates and unlistings.
    """
    manifest = json.loads(raw)
    require(manifest.get('schema') == 1 and isinstance(manifest.get('cartridges'), list)
            and len(raw) <= 1024 * 1024, 'Invalid generated catalog mirror')
    release = json.loads(gh('api', f'repos/{REPO}/releases/tags/{TAG}'))
    require(release.get('tag_name') == TAG and type(release.get('id')) is int
            and not release.get('draft', True), 'Cover Release must be published first')
    name = 'catalog-v2.json'
    digest = 'sha256:' + hashlib.sha256(raw).hexdigest()
    asset = next((a for a in release.get('assets', []) if a['name'] == name), {})
    if asset.get('size') == len(raw) and asset.get('digest') == digest:
        return
    with tempfile.TemporaryDirectory(prefix='turbo8-catalog-mirror-') as tmp:
        path = Path(tmp) / name
        path.write_bytes(raw)
        gh('release', 'upload', TAG, str(path), '--repo', REPO, '--clobber')
    fresh = json.loads(gh('api', f'repos/{REPO}/releases/{release["id"]}'))
    asset = next((a for a in fresh.get('assets', []) if a['name'] == name), {})
    require(asset.get('size') == len(raw) and asset.get('digest') == digest,
            'Catalog mirror failed size/SHA-256 verification')


def verify(entries, base):
    """Check actual public delivery, not only the catalog JSON."""
    def check(entry):
        metadata = entry['cover']
        require(metadata['path'] == 'covers/' + metadata['sha256'] + '.png', 'Invalid cover path')
        with urllib.request.urlopen(base + metadata['path'], timeout=20) as response:
            raw = response.read(MAX_BYTES + 1)
        require(len(raw) == metadata['bytes'] and hashlib.sha256(raw).hexdigest() == metadata['sha256']
                and png_size(raw) == SIZE, 'Public cover failed verification: ' + entry['id'])
    with ThreadPoolExecutor(max_workers=4) as workers:
        list(workers.map(check, entries))
    print(f'Public covers verified: {len(entries)} matching PNGs.')
