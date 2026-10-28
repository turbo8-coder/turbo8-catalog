// Controls: which Turbo8 button presses which GBA button. Edit freely.
//
// Turbo8 buttons: LEFT RIGHT UP DOWN A B SELECT START X Y LB RB LT RT
// (keyboard A/B = J/K or Z/X, gamepad A = bottom, B = right; touch shows A/B).
// GBA buttons:    A B SELECT START RIGHT LEFT UP DOWN R L
//
// By default A/B are mapped by position, as GBA emulators do: the GBA's A is
// the right-hand face button, so Turbo8 B presses GBA A. Swap the two lines
// below if you prefer A = A. Several Turbo8 buttons may press one GBA button
// (e.g. add  Y: 'A'  for a second jump button).
const GBA_KEYMAP = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  UP: 'UP',
  DOWN: 'DOWN',
  B: 'A',
  A: 'B',
  SELECT: 'SELECT',
  START: 'START',
  LB: 'L',
  RB: 'R',
};
