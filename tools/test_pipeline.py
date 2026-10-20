#!/usr/bin/env python3
import copy
import base64
import importlib.util
import json
import struct
import unittest
from unittest.mock import patch
import io
import zlib
import hashlib
from pathlib import Path
from compatibility_cases import cases

spec = importlib.util.spec_from_file_location('pipeline', Path(__file__).with_name('catalog_pipeline.py'))
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
CART = 'u123-' + 'a' * 32


def png(w, h):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress((b'\0' + b'\0' * w * 3) * h)) + chunk(b'IEND', b'')


def fixture():
    meta = {'schema': 1, 'id': CART, 'author_id': 123, 'title': 'Review fixture', 'summary': 'A test', 'version': '1.0.0', 'changes': 'Initial submission'}
    index = {'name': meta['title'], 'cartridgeVersion': meta['version'], 'scripts': ['main.js'], 'resolution': {'width': 256, 'height': 144}}
    return {'submission.json': p.json_bytes(meta), 'cartridge/index.json': p.json_bytes(index), 'cartridge/main.js': b'function _draw() { cls(0); }\n', 'cartridge/cover.png': png(256, 144), 'cartridge/palette.json': b'["#000000","#ffffff"]', 'cartridge/sprites.json': b'[]'}


class ValidationTests(unittest.TestCase):
    def test_publication_dates_are_stable_asset_dates(self):
        entries = [{'id': 'one', 'tag': 'shared', 'asset': 'one.zip'},
                   {'id': 'two', 'tag': 'shared', 'asset': 'two.zip'}]
        release = {'published_at': '2026-10-01T00:00:00Z', 'assets': [
            {'name': 'one.zip', 'created_at': '2026-10-02T00:00:00Z'},
            {'name': 'two.zip', 'created_at': '2026-10-03T00:00:00Z'}]}
        with patch.object(p, 'gh', return_value=json.dumps(release)) as gh:
            p.add_publication_times(entries)
            self.assertEqual(gh.call_count, 1)
        self.assertEqual(entries[0]['updated_at'], '2026-10-02T00:00:00Z')
        self.assertGreater(p.publication_time(entries[1]['updated_at']),
                           p.publication_time(entries[0]['updated_at']))
        with patch.object(p, 'gh', return_value=json.dumps({'assets': []})):
            with self.assertRaisesRegex(ValueError, 'asset is missing'):
                p.add_publication_times(entries)
        for value in (None, '', 'invalid', '2026-02-30T00:00:00Z'):
            self.assertEqual(p.publication_time(value), 0)

    def test_editor_compatibility_cases(self):
        for name, files, expected in cases(fixture):
            with self.subTest(name=name):
                if expected:
                    p.validate(files, CART)
                else:
                    with self.assertRaises(ValueError):
                        p.validate(files, CART)

    def test_optional_submission_fields_and_extensions(self):
        files = fixture()
        meta = json.loads(files['submission.json'])
        meta.pop('summary'); meta['changes'] = ''; meta['optionalExtension'] = {'enabled': True}
        files['submission.json'] = p.json_bytes(meta)
        validated = p.validate(files, CART)[0]
        self.assertEqual(validated['summary'], '')
        self.assertEqual(validated['changes'], '')
        self.assertEqual(validated['optionalExtension'], {'enabled': True})

    def test_unicode_metadata_uses_editor_character_limits(self):
        files = fixture()
        meta = json.loads(files['submission.json'])
        meta['title'] = '🌍' * 120; meta['summary'] = '🌍' * 2000; meta['changes'] = '🌍' * 2000
        files['submission.json'] = p.json_bytes(meta)
        index = json.loads(files['cartridge/index.json']); index['name'] = meta['title']
        files['cartridge/index.json'] = p.json_bytes(index)
        self.assertGreater(len(files['submission.json']), 16384)
        p.validate(files, CART)

    def test_json_extensions_preserved_and_reported(self):
        files = fixture(); raw = b'{"future":true}'
        files['cartridge/extensions/animation.json'] = raw
        packed = p.validate(files, CART)[1]
        with p.zipfile.ZipFile(io.BytesIO(packed)) as archive:
            self.assertEqual(archive.read('extensions/animation.json'), raw)
        self.assertIn('extensions/animation.json', p.compatibility_warnings(files)[0])

    def test_nested_extension_cannot_shadow_loader_resources(self):
        for name in ('index', 'maps', 'postEffects', 'virtualButtons'):
            files = fixture(); files['cartridge/extensions/' + name + '.json'] = b'{}'
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, 'shadows'):
                p.validate(files, CART)

    def test_unicode_paths_do_not_allow_traversal_or_host_paths(self):
        for path in ('cartridge/美术资源.js', 'cartridge/farm and story.js',
                     'cartridge/AUREOLE / FLIGHT.js'):
            self.assertTrue(p.safe_path(path))
        for path in ('/absolute', 'cartridge/../escape', 'cartridge//index.json',
                     'C:/host/path', 'cartridge\\index.json', 'cartridge/\x00bad',
                     'cartridge/.github/workflows/config.json', 'cartridge/\nbad'):
            with self.subTest(path=path):
                self.assertFalse(p.safe_path(path))

    def test_new_format_is_explicitly_reported_not_silently_supported(self):
        files = fixture(); index = json.loads(files['cartridge/index.json'])
        index['version'] = '999.0'; files['cartridge/index.json'] = p.json_bytes(index)
        p.validate(files, CART)
        self.assertIn('playtest compatibility', p.compatibility_warnings(files)[0])

    def test_extension_does_not_weaken_file_budget_or_script_allowlist(self):
        for name, raw in [('future.json', b'x' * (p.MAX_FILE + 1)),
                          ('future.json', b'{'), ('future.js', b'throw 1;'),
                          ('future.exe', b'MZ')]:
            files = fixture(); files['cartridge/' + name] = raw
            with self.subTest(name=name), self.assertRaises(ValueError):
                p.validate(files, CART)

    def test_editor_contract_provenance_when_sources_available(self):
        root = Path(__file__).resolve().parents[2]
        if not (root / 'Editor/document.gd').exists():
            self.skipTest('Cloud checkout uses the generated editor contract')
        for name, digest in p.CONTRACT['source_sha256'].items():
            with self.subTest(source=name):
                self.assertEqual(hashlib.sha256((root / name).read_bytes()).hexdigest(), digest,
                                 'Run sync_contract.py and real-editor parity tests before deploying changed editor rules')

    def test_virtual_buttons_roundtrip(self):
        # Absence remains supported; an empty list means joystick-only.
        p.validate(fixture(), CART)
        for buttons in ([], ['A', 'B'], ['A', 'B', 'X', 'Y'],
                        ['A', 'B', 'SELECT', 'START', 'X', 'Y', 'LB', 'RB', 'LT', 'RT']):
            for controls in (None, True, False):
                with self.subTest(buttons=buttons, controls=controls):
                    files = fixture()
                    files['cartridge/virtualButtons.json'] = p.json_bytes(buttons)
                    if controls is not None:
                        files['cartridge/virtualControls.json'] = p.json_bytes(controls)
                    raw = p.validate(files, CART)[1]
                    with p.zipfile.ZipFile(io.BytesIO(raw)) as archive:
                        self.assertEqual(json.loads(archive.read('virtualButtons.json')), buttons)
                        if controls is not None:
                            self.assertIs(json.loads(archive.read('virtualControls.json')), controls)

    def test_reject_invalid_virtual_buttons(self):
        for buttons, message in [
            (None, 'array'), (True, 'array'), (1, 'array'), ('A', 'array'), ({}, 'array'),
            (['A'] * 11, 'up to 10'), (['A', 'A'], 'duplicate'),
            (['LEFT'], 'unknown'), (['a'], 'unknown'), (['UNKNOWN'], 'unknown'),
            ([1], 'unknown'), ([False], 'unknown'), ([None], 'unknown'),
            ([[]], 'unknown'), ([{}], 'unknown'),
        ]:
            with self.subTest(buttons=buttons):
                files = fixture()
                files['cartridge/virtualButtons.json'] = p.json_bytes(buttons)
                with self.assertRaisesRegex(ValueError, message):
                    p.validate(files, CART)

    def test_virtual_controls_requires_boolean(self):
        for controls in (True, False, None, 0, 1, 'false', [], {}):
            with self.subTest(controls=controls):
                files = fixture()
                files['cartridge/virtualControls.json'] = p.json_bytes(controls)
                if type(controls) is bool:
                    p.validate(files, CART)
                else:
                    with self.assertRaisesRegex(ValueError, 'must contain a boolean'):
                        p.validate(files, CART)

    def test_malformed_virtual_input_json(self):
        for name in ('virtualButtons', 'virtualControls'):
            files = fixture()
            files['cartridge/' + name + '.json'] = b'{'
            with self.subTest(name=name), self.assertRaises(ValueError):
                p.validate(files, CART)

    def test_unexpected_file_error_names_file(self):
        files = fixture()
        files['cartridge/secret.txt'] = b'not a cartridge resource'
        with self.assertRaisesRegex(ValueError, r'Unexpected cartridge file: secret\.txt'):
            p.validate(files, CART)

    def test_retired_controls_are_ignored(self):
        files = fixture()
        meta = json.loads(files['submission.json'])
        meta['controls'] = 123
        files['submission.json'] = p.json_bytes(meta)
        self.assertNotIn('controls', p.validate(files, CART, actor=123)[0])

    def test_retired_license_fields_are_ignored(self):
        files = fixture()
        meta = json.loads(files['submission.json'])
        meta.update(code_license=123, assets_license='')
        files['submission.json'] = p.json_bytes(meta)
        validated = p.validate(files, CART, actor=123)[0]
        self.assertNotIn('code_license', validated)
        self.assertNotIn('assets_license', validated)

    def test_retired_remix_field_is_ignored(self):
        files = fixture()
        meta = json.loads(files['submission.json'])
        meta['remix_of'] = 'old/invalid/source'
        files['submission.json'] = p.json_bytes(meta)
        self.assertNotIn('remix_of', p.validate(files, CART, actor=123)[0])

    def test_optional_prose_client_placeholders(self):
        files = fixture()
        meta = json.loads(files['submission.json'])
        meta.update(summary='No description provided.', changes='No update notes provided.')
        files['submission.json'] = p.json_bytes(meta)
        p.validate(files, CART, actor=123)

    def test_deterministic_zip(self):
        one = p.validate(fixture(), CART)
        two = p.validate(dict(reversed(list(fixture().items()))), CART)
        self.assertEqual(one[1], two[1])

    def test_author_cannot_be_forged(self):
        with self.assertRaisesRegex(ValueError, 'verified GitHub author'):
            p.validate(fixture(), CART, actor=456)

    def test_version_must_increase(self):
        f = fixture()
        previous = json.loads(f['submission.json'])
        with self.assertRaisesRegex(ValueError, 'increase'):
            p.validate(f, CART, previous=previous)

    def test_unsafe_files(self):
        for name in ['../escape', '.github/workflows/test.yml', 'cartridge/../../escape', 'cartridge/main.js/../extra', 'cartridge/Main.js', 'cartridge/secret.txt']:
            f = fixture(); f[name] = b'x'
            with self.subTest(name=name), self.assertRaises(ValueError):
                p.validate(f, CART)

    def test_metadata_must_match_package(self):
        f = fixture(); index = json.loads(f['cartridge/index.json']); index['name'] = 'Forged'; f['cartridge/index.json'] = p.json_bytes(index)
        with self.assertRaisesRegex(ValueError, 'match'):
            p.validate(f, CART)

    def test_reject_malformed_png(self):
        f = fixture(); f['cartridge/cover.png'] = f['cartridge/cover.png'][:-5]
        with self.assertRaises(ValueError): p.validate(f, CART)

    def test_reject_bad_js_without_executing(self):
        f = fixture(); f['cartridge/main.js'] = b'function broken( {'
        with self.assertRaisesRegex(ValueError, 'syntax'): p.validate(f, CART)
        f['cartridge/main.js'] = b'throw new Error("must never execute");'
        p.validate(f, CART)

    def test_godot_integral_float_canvas(self):
        f = fixture(); index = json.loads(f['cartridge/index.json']); index['resolution'] = {'width': 256.0, 'height': 144.0}; f['cartridge/index.json'] = p.json_bytes(index)
        self.assertEqual(p.validate(f, CART)[3], {'width': 256, 'height': 144})

    def test_canvas_and_duplicate_scripts(self):
        for change in [{'resolution': {'width': 512, 'height': 512}}, {'scripts': ['main.js', 'main.js']}, {'images': {}}]:
            f = fixture(); index = json.loads(f['cartridge/index.json']); index.update(change); f['cartridge/index.json'] = p.json_bytes(index)
            with self.assertRaises(ValueError): p.validate(f, CART)

    def test_expanded_budget(self):
        f = fixture(); f['cartridge/main.js'] = b' ' * (p.MAX_EXPANDED + 1)
        with self.assertRaisesRegex(ValueError, 'expanded'): p.validate(f, CART)

    def test_public_api_is_fixed(self):
        with self.assertRaisesRegex(ValueError, 'Unexpected API path'): p.api('https://example.com/token')


class RenameEventTests(unittest.TestCase):
    def fixture(self):
        return {'number': 3, 'base': {'ref': 'main', 'repo': {'id': 12345, 'full_name': p.REPO}},
                'head': {'sha': 'a' * 40, 'repo': {'full_name': p.REPO}}}

    def test_old_event_uses_current_repository_names(self):
        current = self.fixture()
        event = copy.deepcopy(current)
        event['base']['repo']['full_name'] = 'previous-owner/turbo8-catalog'
        event['head']['repo']['full_name'] = 'previous-owner/turbo8-catalog'
        self.assertIs(p.current_review_pr(event, current), current)

    def test_other_repository_id_rejected(self):
        current = self.fixture(); event = copy.deepcopy(current)
        event['base']['repo']['id'] = 67890
        with self.assertRaisesRegex(ValueError, 'identity changed'):
            p.current_review_pr(event, current)

    def test_missing_repository_identity_rejected(self):
        current = self.fixture(); event = copy.deepcopy(current)
        del event['base']['repo']['id']
        with self.assertRaisesRegex(ValueError, 'identity changed'):
            p.current_review_pr(event, current)

    def test_updated_head_still_rejected(self):
        current = self.fixture(); event = copy.deepcopy(current)
        event['head']['sha'] = 'b' * 40
        with self.assertRaisesRegex(ValueError, 'PR changed'):
            p.current_review_pr(event, current)

    def test_current_target_must_be_official_main(self):
        event = self.fixture(); current = copy.deepcopy(event)
        current['base']['repo']['full_name'] = 'other/turbo8-catalog'
        with self.assertRaisesRegex(ValueError, 'Unexpected PR target'):
            p.current_review_pr(event, current)
        current = copy.deepcopy(event); current['base']['ref'] = 'untrusted'
        with self.assertRaisesRegex(ValueError, 'Unexpected PR target'):
            p.current_review_pr(event, current)


class BlobBudgetTests(unittest.TestCase):
    def test_wrapped_blob_response_fits(self):
        for size in (0, 1, 2, 3, 2388769, 16 * 1024 * 1024):
            with self.subTest(size=size):
                encoded = base64.b64encode(b'x' * size).decode('ascii')
                content = ''.join(encoded[i:i + 60] + '\n' for i in range(0, len(encoded), 60))
                raw = json.dumps({'encoding': 'base64', 'content': content}).encode()
                limit = p.blob_response_limit(size)
                if size == 2388769:
                    self.assertGreater(len(raw), size * 4 // 3 + 65536)
                with patch.dict(p.os.environ, GH_TOKEN='test'), patch.object(p.urllib.request, 'build_opener') as opener:
                    opener.return_value.open.return_value = io.BytesIO(raw)
                    blob = p.api('/repos/' + p.REPO + '/git/blobs/' + 'a' * 40, limit)
                self.assertEqual(len(base64.b64decode(blob['content'])), size)

    def test_transport_response_still_bounded(self):
        limit = p.blob_response_limit(1)
        with patch.dict(p.os.environ, GH_TOKEN='test'), patch.object(p.urllib.request, 'build_opener') as opener:
            opener.return_value.open.return_value = io.BytesIO(b' ' * (limit + 1))
            with self.assertRaisesRegex(ValueError, 'response exceeds limit'):
                p.api('/repos/' + p.REPO + '/git/blobs/' + 'a' * 40, limit)

    def test_tree_file_budget_and_decoded_size_unchanged(self):
        for size, data, message in [(16 * 1024 * 1024 + 1, b'', 'File budget exceeded'), (1, b'xx', 'Blob size mismatch')]:
            with self.subTest(size=size):
                responses = [
                    {'tree': [{'path': 'carts', 'type': 'tree', 'sha': 'b' * 40}]},
                    {'tree': [{'path': CART, 'type': 'tree', 'sha': 'c' * 40}]},
                    {'tree': [{'path': 'submission.json', 'type': 'blob', 'mode': '100644', 'size': size, 'sha': 'd' * 40}]},
                    {'encoding': 'base64', 'content': base64.b64encode(data).decode()},
                ]
                with patch.object(p, 'api', side_effect=responses) as api:
                    with self.assertRaisesRegex(ValueError, message):
                        p.tree_files(p.REPO, 'a' * 40, CART)
                    if size > 16 * 1024 * 1024:
                        self.assertEqual(api.call_count, 3)
                    else:
                        self.assertEqual(api.call_args.args[1], p.blob_response_limit(size))


class PublicationTests(unittest.TestCase):
    def release_stub(self, existing_bytes=None, draft=True):
        state = {'id': 123, 'tag_name': 'test-tag', 'draft': draft, 'assets': [] if existing_bytes is None else [{'name': 'fixture.zip'}]}
        calls = []
        def fake_gh(*args):
            calls.append(args)
            if args[:3] == ('api', '--method', 'PATCH'):
                self.assertEqual(args[3], f'repos/{p.REPO}/releases/123')
                state['draft'] = False
                return json.dumps(state)
            if args[0] == 'api': return json.dumps([state])
            if args[:2] == ('release', 'download'):
                directory = Path(args[args.index('--dir') + 1]); (directory / 'fixture.zip').write_bytes(existing_bytes)
            if args[:2] == ('release', 'upload'): state['assets'] = [{'name': 'fixture.zip'}]
            if args[:2] == ('release', 'edit'): state['draft'] = False
            return ''
        return state, calls, fake_gh

    def test_resume_draft_release(self):
        state, calls, fake = self.release_stub()
        with patch.object(p, 'gh', fake), patch.object(p.urllib.request, 'urlopen', return_value=io.BytesIO(b'zip')):
            p.release_asset('test-tag', 'fixture.zip', b'zip', 'a' * 40)
        self.assertFalse(state['draft'])
        self.assertEqual(sum(c[:2] == ('release', 'upload') for c in calls), 1)
        self.assertFalse(any('POST' in c or any('/releases/tags/' in x for x in c) for c in calls))

    def test_first_draft_uses_creation_response_and_numeric_id(self):
        state, calls, base = self.release_stub()
        def fake(*args):
            if args[0] == 'api' and args[1].endswith('page=1'):
                calls.append(args)
                return '[]'
            if args[:3] == ('api', '--method', 'POST'):
                calls.append(args)
                self.assertIn('draft=true', args)
                return json.dumps(state)
            self.assertFalse(any('/releases/tags/' in value for value in args))
            return base(*args)
        with patch.object(p, 'gh', fake), patch.object(p.urllib.request, 'urlopen', return_value=io.BytesIO(b'zip')):
            p.release_asset('test-tag', 'fixture.zip', b'zip', 'a' * 40)
        self.assertFalse(state['draft'])
        self.assertEqual(sum('POST' in c for c in calls), 1)

    def test_draft_beyond_first_page_is_resumed(self):
        state, calls, base = self.release_stub()
        def fake(*args):
            if args[0] == 'api' and args[1].endswith('page=1'):
                calls.append(args)
                return json.dumps([{'tag_name': f'other-{i}'} for i in range(100)])
            return base(*args)
        with patch.object(p, 'gh', fake), patch.object(p.urllib.request, 'urlopen', return_value=io.BytesIO(b'zip')):
            p.release_asset('test-tag', 'fixture.zip', b'zip', 'a' * 40)
        self.assertFalse(state['draft'])
        self.assertTrue(any(c[1].endswith('page=2') for c in calls if c[0] == 'api'))
        self.assertFalse(any('POST' in c for c in calls))

    def test_retry_preserves_existing_asset(self):
        state, calls, fake = self.release_stub(b'zip', draft=False)
        with patch.object(p, 'gh', fake), patch.object(p.urllib.request, 'urlopen', return_value=io.BytesIO(b'zip')):
            p.release_asset('test-tag', 'fixture.zip', b'zip', 'a' * 40)
        self.assertFalse(any(c[:2] == ('release', 'upload') or 'PATCH' in c for c in calls))

    def test_uploaded_draft_is_verified_then_published_without_reupload(self):
        state, calls, fake = self.release_stub(b'zip', draft=True)
        with patch.object(p, 'gh', fake), patch.object(p.urllib.request, 'urlopen', return_value=io.BytesIO(b'zip')):
            p.release_asset('test-tag', 'fixture.zip', b'zip', 'a' * 40)
        self.assertFalse(state['draft'])
        self.assertFalse(any(c[:2] == ('release', 'upload') for c in calls))
        self.assertTrue(any('PATCH' in c for c in calls))

    def test_version_collision_fails_without_overwrite(self):
        state, calls, fake = self.release_stub(b'old', draft=False)
        with patch.object(p, 'gh', fake), self.assertRaisesRegex(ValueError, 'different bytes'):
            p.release_asset('test-tag', 'fixture.zip', b'new', 'a' * 40)
        self.assertFalse(any(c[:2] == ('release', 'upload') for c in calls))

    def test_bad_public_download_blocks_catalog(self):
        state, calls, fake = self.release_stub(b'zip', draft=False)
        with patch.object(p, 'gh', fake), patch.object(p.urllib.request, 'urlopen', return_value=io.BytesIO(b'corrupt')), self.assertRaisesRegex(ValueError, 'Public Release'):
            p.release_asset('test-tag', 'fixture.zip', b'zip', 'a' * 40)


if __name__ == '__main__': unittest.main()
