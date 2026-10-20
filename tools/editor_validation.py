"""Data-only mirror of the editor's loader, driven by an editor-generated contract.

Do not import or execute submitted scripts. Optional resource normalization is
used for validation only; original cartridge bytes are retained in the ZIP.
"""
import json
import math
import re
from pathlib import Path

CONTRACT = json.loads(Path(__file__).with_name('editor_contract.json').read_text())
LIMITS = CONTRACT['limits']
COLOR = re.compile(r'#[a-fA-F0-9]{6}')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_json(raw):
    def invalid_constant(value):
        raise ValueError('Non-JSON numeric constant: ' + value)
    return json.loads(raw.decode('utf-8') if isinstance(raw, bytes) else raw, parse_constant=invalid_constant)


def number(value):
    return type(value) in (int, float) and math.isfinite(value)


def integer(value):
    return number(value) and value == int(value)


def script_files(index):
    scripts = index.get('scripts', ['main.js'])
    require(isinstance(scripts, list) and 1 <= len(scripts) <= LIMITS['scripts'], 'Invalid script list')
    names = []
    for script in scripts:
        require(isinstance(script, str), 'Invalid script filename')
        name = script if script.endswith('.js') else script + '.js'
        stem = name[:-3]
        require(stem.strip() and len(stem) <= LIMITS['scriptName'] and
                '..' not in stem and not stem.startswith('/') and '\\' not in stem,
                'Invalid script filename: ' + script)
        names.append(name)
    require(len({name.lower() for name in names}) == len(names), 'Duplicate scripts')
    return names


def validate_map(value):
    rules = CONTRACT['map']
    require(isinstance(value, dict), 'Invalid map object')
    w, h, layers = value.get('width'), value.get('height'), value.get('layers')
    require(isinstance(layers, list) and layers, 'Map must contain layers')
    require(all(integer(n) and 1 <= n <= rules['side'] for n in (w, h)), 'Invalid map dimensions')
    require((w <= rules['legacySide'] and h <= rules['legacySide']) or
            (len(layers) <= rules['layers'] and w * h <= rules['pixels'] and
             w * h * len(layers) <= rules['cells']), 'Map exceeds editor limits')
    require(value.get('tilewidth') == 8 and value.get('tileheight') == 8 and
            value.get('orientation') == 'orthogonal', 'Map must use 8x8 orthogonal tiles')
    for layer in layers:
        require(isinstance(layer, dict), 'Invalid map layer')
        cells = layer.get('data')
        require(layer.get('type') == 'tilelayer' and isinstance(cells, list) and
                len(cells) == w * h and layer.get('x', 0) == 0 and layer.get('y', 0) == 0,
                'Invalid map layer shape or offset')
        require(all(integer(n) and 0 <= n <= LIMITS['sprites'] for n in cells), 'Invalid map tile ID')


def validate_sound(sound):
    require(isinstance(sound, dict), 'Invalid SFX object')
    if 'pico_notes' in sound:
        notes = sound['pico_notes']
        require(isinstance(notes, list) and len(notes) == 32, 'PICO-8 SFX requires 32 notes')
        for key, upper in [('pico_speed', 255), ('pico_loop_start', 32), ('pico_loop_end', 32)]:
            require(number(sound.get(key)) and 0 <= sound[key] <= upper, 'Invalid PICO-8 SFX timing')
        for note in notes:
            require(isinstance(note, dict), 'Invalid PICO-8 note')
            for key, upper in [('pitch', 63), ('wave', 7), ('volume', 7), ('effect', 7)]:
                require(number(note.get(key)) and 0 <= note[key] <= upper, 'Invalid PICO-8 note value')
    for key in ('frequency', 'duration', 'volume', 'slide'):
        require(key not in sound or number(sound[key]), 'Invalid SFX ' + key)


def validate_music(music):
    require(isinstance(music, dict), 'Invalid music object')
    steps = music.get('steps')
    require(isinstance(steps, list) and 1 <= len(steps) <= LIMITS['musicSteps'], 'Invalid music steps')
    if 'pico_channels' in music:
        channels = music['pico_channels']
        require(isinstance(channels, list) and len(channels) == 4 and
                all(integer(n) and 0 <= n <= 255 for n in channels), 'Invalid PICO-8 music channels')
    require(number(music.get('speed', 120)), 'Invalid music speed')
    for step in steps:
        require(isinstance(step, dict) and all(isinstance(step.get(k), list) and len(step[k]) == 4
                                             for k in ('notes', 'volumes', 'types')), 'Invalid music step channels')
        require(all(n is None or number(n) for n in step['notes']), 'Invalid music notes')
        require(all(number(n) for n in step['volumes']) and all(isinstance(n, str) for n in step['types']),
                'Invalid music volumes or types')


def validate_effects(effects):
    require(isinstance(effects, dict) and isinstance(effects.get('preset', ''), str) and
            number(effects.get('base', 0)) and isinstance(effects.get('values'), dict),
            'Invalid cartridge post effects')
    rules = CONTRACT['effects']
    for key, value in effects['values'].items():
        require(key in rules['defaults'], 'Unsupported post-effect parameter in editor contract: ' + key)
        if type(rules['defaults'][key]) is bool:
            require(type(value) is bool, 'Post-effect ' + key + ' must be boolean')
        else:
            require(number(value), 'Post-effect ' + key + ' must be finite numeric data')
            if key in rules['bounds']:
                low, high = rules['bounds'][key]
                require(low <= value <= high, 'Post-effect ' + key + ' is out of range')
            require(key not in rules['integers'] or integer(value), 'Post-effect ' + key + ' must be integral')


def validate_resources(cartridge):
    data = {name[:-5]: read_json(raw) for name, raw in cartridge.items() if name.endswith('.json')}
    palette = data.get('palette')
    require(isinstance(palette, list) and 1 <= len(palette) <= LIMITS['palette'] and
            all(isinstance(c, str) and COLOR.fullmatch(c) for c in palette), 'Invalid or missing palette')
    if 'sprites' in data:
        sprites = data['sprites']
        require(isinstance(sprites, list) and len(sprites) <= LIMITS['sprites'], 'Invalid sprites')
        require(all(isinstance(sprite, list) and len(sprite) <= LIMITS['spritePixels'] and
                    all(c is None or isinstance(c, str) and COLOR.fullmatch(c) for c in sprite)
                    for sprite in sprites), 'Invalid sprite pixels')
    for name, check in [('maps', validate_map), ('sfx', validate_sound), ('music', validate_music)]:
        # Match normalize(): old/missing optional arrays become [].
        resources = data.get(name)
        if not isinstance(resources, list):
            continue
        require(len(resources) <= LIMITS[name], 'Too many ' + name)
        for value in resources:
            check(value)
    metadata = data.get('spriteMeta')
    if isinstance(metadata, dict):
        require(all(isinstance(value, dict) for value in metadata.values()), 'Invalid sprite metadata')
    flags = data.get('flags')
    if isinstance(flags, list):
        require(all(number(n) and 0 <= n <= 255 for n in flags), 'Invalid sprite flags')
        # The editor truncates/pads flags; do not reject a legacy oversized array.
    if 'postEffects' in data:
        validate_effects(data['postEffects'])
    if 'virtualControls' in data:
        require(type(data['virtualControls']) is bool, 'virtualControls.json must contain a boolean')
    if 'virtualButtons' in data:
        buttons = data['virtualButtons']
        require(isinstance(buttons, list) and len(buttons) <= LIMITS['virtualButtons'],
                'virtualButtons.json must contain an array of up to 10 action names')
        require(all(isinstance(button, str) and button in CONTRACT['virtual_actions'] for button in buttons),
                'virtualButtons.json contains an unknown action button')
        require(len(set(buttons)) == len(buttons), 'virtualButtons.json contains duplicate action buttons')


def compatibility_warnings(files):
    """Informative only: older editors ignore extra JSON metadata and format labels."""
    prefix = 'cartridge/'
    cartridge = {name[len(prefix):]: raw for name, raw in files.items() if name.startswith(prefix)}
    index = read_json(cartridge['index.json'])
    warnings = []
    if 'version' in index and index['version'] not in CONTRACT['writer_versions']:
        warnings.append('Unrecognized cartridge format label %s: checked known editor fields only; playtest compatibility.'
                        % repr(index['version'])[:200])
    known = {name + '.json' for name in CONTRACT['resource_json']} | {'index.json'}
    extra = sorted(name for name in cartridge if name.endswith('.json') and name not in known)
    if extra:
        warnings.append('Preserved %d optional JSON resources ignored by this editor: ' % len(extra) +
                        ', '.join(extra)[:2000])
    return warnings
