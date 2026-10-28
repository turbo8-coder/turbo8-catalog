// Game variables found automatically by playing the game and watching RAM
// (Runtime/gba/recomp/state-probe.js). Names describe observed behaviour;
// they are not the original source names. Values are raw game units
// (positions are usually fixed-point, e.g. 1/256 pixel).

const game = {
  // rises with RIGHT, falls with LEFT; keeps written values. Found at 6 of 6 checkpoints.
  get player_x() { return machine.read(0x02000010, 4); },
  set player_x(value) { machine.write(0x02000010, 4, value); },
  // dips by 5688 during a jump and returns; keeps written values; +4 bytes from player_x. Found at 5 of 6 checkpoints.
  get player_y() { return machine.read(0x02000014, 4); },
  set player_y(value) { machine.write(0x02000014, 4, value); },
};

// Called after every game frame. Example: hold LB to glide right.
// (On the ground most games re-snap player_y to the floor each frame,
// so vertical changes only last while airborne.)
// function game_frame() {
//   if (btn(10)) game.player_x += 256;
// }
