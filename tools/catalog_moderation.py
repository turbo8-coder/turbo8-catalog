"""Admin-only catalog visibility changes; releases and review history are retained.

The deployed catalog carries the visibility ledger. Both publication workflows
share one concurrency group, fetch the latest verified ledger and preserve it.
Never silently replace an unavailable or malformed ledger with an empty one.
"""
import copy
import json
import os
import re
import time
import urllib.request
from datetime import datetime, timezone

MAX_MANIFEST = 1024 * 1024
IDENTIFIER = re.compile(r'[A-Za-z0-9][A-Za-z0-9._-]{0,95}')
SHA256 = re.compile(r'[a-f0-9]{64}')


def require(value, message):
    if not value:
        raise ValueError(message)


def valid_id(value):
    return isinstance(value, str) and IDENTIFIER.fullmatch(value) and '..' not in value


def current_catalog():
    url = 'https://turbo8-coder.github.io/turbo8-catalog/catalog-v2.json?moderation=' + str(time.time_ns())
    with urllib.request.urlopen(url, timeout=30) as response:
        raw = response.read(MAX_MANIFEST + 1)
    require(len(raw) <= MAX_MANIFEST, 'Published catalog exceeds its size limit')
    data = json.loads(raw)
    require(isinstance(data, dict) and data.get('schema') == 1 and
            isinstance(data.get('cartridges'), list), 'Cannot read the published catalog safely')
    ledger(data)
    return data


def ledger(manifest):
    records = manifest.get('unlisted', {})
    require(isinstance(records, dict) and len(records) <= 5000, 'Invalid unlisting ledger')
    for cart_id, record in records.items():
        require(valid_id(cart_id) and isinstance(record, dict) and
                SHA256.fullmatch(str(record.get('sha256', ''))) and
                isinstance(record.get('title'), str) and len(record['title']) <= 120 and
                type(record.get('actor_id')) is int and record['actor_id'] > 0 and
                isinstance(record.get('actor'), str) and len(record['actor']) <= 100 and
                re.fullmatch(r'[a-f0-9]{32}', str(record.get('request_id', ''))) and
                isinstance(record.get('unlisted_at'), str) and len(record['unlisted_at']) == 20,
                'Invalid unlisting record; refusing to relist hidden cartridges')
    return copy.deepcopy(records)


def require_admin(api, repository):
    # These values are supplied by GitHub Actions, not by workflow inputs.
    require(os.environ.get('GITHUB_ACTIONS') == 'true' and
            os.environ.get('GITHUB_REPOSITORY') == repository and
            os.environ.get('GITHUB_REF') == 'refs/heads/main',
            'Moderation must run from the trusted main workflow')
    actor = os.environ.get('GITHUB_ACTOR', '')
    actor_id = os.environ.get('GITHUB_ACTOR_ID', '')
    require(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9-]{0,99}', actor) and actor_id.isdigit(),
            'Invalid workflow actor')
    permission = api(f'/repos/{repository}/collaborators/{actor}/permission')
    require(permission.get('permission') == 'admin' and
            int(permission.get('user', {}).get('id', 0)) == int(actor_id),
            'Only repository administrators may unlist cartridges')
    return actor, int(actor_id)


def plan_unlist(manifest, cart_id, expected_sha, request_id, actor, actor_id):
    require(valid_id(cart_id), 'Invalid cartridge ID')
    require(isinstance(expected_sha, str) and SHA256.fullmatch(expected_sha), 'Invalid expected cartridge hash')
    require(isinstance(request_id, str) and re.fullmatch(r'[a-f0-9]{32}', request_id), 'Invalid request ID')
    records = ledger(manifest)
    matches = [entry for entry in manifest['cartridges'] if entry.get('id') == cart_id]
    if not matches and cart_id in records:
        require(records[cart_id]['sha256'] == expected_sha, 'This cartridge changed; refresh before retrying')
        return records  # Retry of a completed operation is harmless.
    require(len(matches) == 1, 'Cartridge is not currently listed; refresh Online')
    item = matches[0]
    require(item.get('sha256') == expected_sha, 'The cartridge was updated; refresh and confirm the new version')
    records[cart_id] = {
        'title': item['title'], 'sha256': expected_sha, 'actor': actor,
        'actor_id': actor_id, 'request_id': request_id,
        'unlisted_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    }
    ledger({'unlisted': records})
    return records


def visible(entries, records):
    # Hide the work's ID, not just one version: a later update cannot
    # automatically circumvent an administrator's unlisting decision.
    ledger({'unlisted': records})
    return [entry for entry in entries if entry['id'] not in records]


def plan_restore(manifest, cart_id, expected_sha):
    """Manual administrator recovery; the app currently exposes unlisting only."""
    require(valid_id(cart_id), 'Invalid cartridge ID')
    records = ledger(manifest)
    require(cart_id in records, 'Cartridge has no active unlisting record')
    require(records[cart_id]['sha256'] == expected_sha,
            'Unlisting record changed; inspect the current visibility history')
    del records[cart_id]
    return records
