// Recompiled GBA game. The machine (hardware layer and generated code) is
// stored compressed in the gba_* scripts and compiled once in _init.
// The GBA refreshes at 59.73 Hz; 60 keeps one GBA frame per 60 Hz tick
// (deterministic input replays) at an unnoticeable 0.45% speed-up.
const GBA_FPS = 60;
// GBA_KEYMAP (script keymap) as [Turbo8 button index, GBA KEYINPUT bit] pairs.
const TURBO8_BUTTONS = ['LEFT', 'RIGHT', 'UP', 'DOWN', 'A', 'B', 'SELECT', 'START', 'X', 'Y', 'LB', 'RB', 'LT', 'RT'];
const GBA_BUTTONS = ['A', 'B', 'SELECT', 'START', 'RIGHT', 'LEFT', 'UP', 'DOWN', 'R', 'L'];
const GBA_KEYS = Object.entries(typeof GBA_KEYMAP === 'object' ? GBA_KEYMAP : {})
  .map(([from, to]) => [TURBO8_BUTTONS.indexOf(from), GBA_BUTTONS.indexOf(to)])
  .filter(([from, to]) => from >= 0 && to >= 0);
let machine = null, screen = null, gbaClock = 0, gbaFrames = 0;
// Battery save: written to cartridge storage once the game has stopped
// writing for half a second (flash saves span many frames).
let regs, ld8, ld8s, ld16, ld16s, ld32, st8, st16, st32, call, swi, lsl, lsr, asr, ror,
  lslCarry, lsrCarry, asrCarry, rorCarry, subOverflow, addOverflow;
let saveQuiet = -1, saveMessage = '', saveMessageFrames = 0;

function _init() {
  const unpack = compile_generated('const module = {exports: {}};\n' + GBA_INFLATE + '\nreturn module.exports;')();
  const source = unpack.asciiText(unpack.inflate(unpack.decodeBase64(GBA_PARTS.join('')), GBA_CODE_SIZE));
  const boot = compile_generated(source)();
  const rom = image_pixels('rom');
  machine = boot(rom, GBA_ROM_SIZE, GBA_ROM_STORED);
  screen = ctx.createImageData(240, 160);
  // Helpers used by readable game functions (game_functions script).
  ({regs, ld8, ld8s, ld16, ld16s, ld32, st8, st16, st32, call, swi, lsl, lsr, asr, ror,
    lslCarry, lsrCarry, asrCarry, rorCarry, subOverflow, addOverflow} = machine.helpers);
  if (typeof GBA_OVERRIDES !== 'undefined') machine.setOverrides(GBA_OVERRIDES);
  const saved = storage_get('gba_save', null);
  if (saved && !machine.importSave(saved)) { saveMessage = 'SAVE DATA UNREADABLE'; saveMessageFrames = 180; }
}

function storeSave() {
  if (machine.saveChanged()) saveQuiet = 30;
  else if (saveQuiet > 0 && --saveQuiet === 0) {
    const ok = storage_set('gba_save', machine.exportSave());
    // The game shows its own save messages; only report failures, briefly.
    if (!ok) { saveMessage = 'SAVE FAILED: ' + storage_status().error; saveMessageFrames = 180; }
  }
}

function _update() {
  let mask = 0;
  for (const [button, bit] of GBA_KEYS) if (btn(button)) mask |= 1 << bit;
  // Keep GBA time in step with real time at any Turbo8 logic rate.
  gbaClock += (typeof __frameSeconds === 'number' ? __frameSeconds : 1 / 30) * GBA_FPS;
  let due = Math.min(4, Math.round(gbaClock) - gbaFrames);
  while (due-- > 0) {
    machine.frame(mask); gbaFrames++;
    storeSave();
    // Mod hook from game_state: runs after every game frame.
    if (typeof game_frame === 'function') game_frame();
  }
  const samples = machine.takeAudio();
  if (samples.length && typeof audio_stream === 'function') audio_stream(samples, 32768);
}

// Backgrounds and hardware sprites are drawn with spr() (see render).
function _draw() {
  gbaDrawFrame(machine, screen);
  if (saveMessageFrames > 0) {
    saveMessageFrames--;
    rectfill(0, 152, 239, 159, 0);
    print(saveMessage.slice(0, 40), 2, 153, 8);
  }
}
