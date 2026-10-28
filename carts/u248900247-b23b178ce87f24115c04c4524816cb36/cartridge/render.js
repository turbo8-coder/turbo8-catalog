// GBA picture -> Turbo8 sprites.
//
// Every frame the game's background maps and hardware sprites (OAM) are drawn
// with spr() from this cartridge's sprite sheet. Sprite slot N holds the 8x8
// GBA tile listed as GBA_TILES.keys[N], coloured with the palette it was
// captured with. Editing that sprite changes the tile everywhere in the game.
//
// Tiles shown with a different palette (fades, palette animation) or never
// captured are recoloured into a scratch atlas; your edited pixels are kept.
// Frames using effects that 8x8 tiles cannot express (rotation/scaling,
// blending, windows, mosaic, per-scanline changes) show the GBA picture as is.

const GBA_W = 240, GBA_H = 160;
const OBJ_SIZES = [[[8, 8], [16, 16], [32, 32], [64, 64]], [[16, 8], [32, 8], [32, 16], [64, 32]], [[8, 16], [8, 32], [16, 32], [32, 64]]];

// Visible tiles of one frame in drawing order (back to front), or null when
// the frame needs the full GBA picture. Entry: [unit, bpp, layer (0-3 BG,
// 4 OBJ), palette bank, x, y, flipX, flipY]; unit = VRAM offset / 32.
function gbaFrameTiles(ppu, st) {
  if (st.forcedBlank || st.raster || st.windows || st.blend || st.mosaic) return null;
  if (st.mode > 1) return null;
  // Affine backgrounds become tiles only when not rotated or scaled.
  for (const bg of st.bgs) if (bg.enabled && bg.affine && !(bg.pa === 1 && bg.pb === 0 && bg.pc === 0 && bg.pd === 1 && Number.isInteger(bg.refx) && Number.isInteger(bg.refy))) return null;
  const vram = ppu.vram, oam = ppu.oam, out = [], affine = [];
  const objects = [[], [], [], []];
  if (st.objEnabled) {
    for (let id = 127; id >= 0; id--) {
      const a0 = oam[id * 4], a1 = oam[id * 4 + 1], a2 = oam[id * 4 + 2];
      if ((a0 & 0x300) === 0x200) continue;                 // hidden
      const kind = (a0 >> 10) & 3;
      if (kind === 1) return null;                          // semi-transparent
      if (kind === 2 && st.windowed) return null;           // OBJ window shapes (not expressible)
      if (kind !== 0 || a0 >>> 14 === 3) continue;          // OBJ window / invalid
      objects[(a2 >> 10) & 3].push(id);
    }
  }
  for (let priority = 3; priority >= 0; priority--) {
    for (let layer = 3; layer >= 0; layer--) {
      const bg = st.bgs[layer];
      if (bg.enabled && bg.priority === priority && !(bg.affine ? gbaAffineTiles(vram, bg, layer, out, ppu.dirtyUnits) : gbaBackgroundTiles(vram, bg, layer, out, ppu.dirtyUnits))) return null;
    }
    // Rotated/scaled objects cannot be tiles: they are drawn pixel by pixel
    // (out.affine, in layer order between the tiles); the rest stays editable.
    for (const id of objects[priority]) {
      if (oam[id * 4] & 0x100) affine.push({at: out.length, ...gbaAffineObject(vram, oam, id, st.objMapping1D)});
      else gbaObjectTiles(oam, id, st.objMapping1D, out);
    }
  }
  // Tile graphics rewritten after some of its rows were already shown.
  if (ppu.dirtyUnits.size) {
    for (const tile of out) {
      const line = Math.min(ppu.dirtyUnits.get(tile[0]) ?? 999, tile[1] === 8 ? ppu.dirtyUnits.get(tile[0] + 1) ?? 999 : 999);
      if (line > Math.max(0, tile[5]) && tile[5] < GBA_H && tile[5] > -8) return null;
    }
  }
  out.affine = affine;
  return out;
}

// A rotated/scaled object as colour indices over its screen box, sampled the
// way the hardware (GBA.js) does: box centre -> matrix -> texture centre.
function gbaAffineObject(vram, oam, id, mapping1D) {
  const a0 = oam[id * 4], a1 = oam[id * 4 + 1], a2 = oam[id * 4 + 2];
  const [w, h] = OBJ_SIZES[a0 >>> 14][a1 >>> 14], bpp = a0 & 0x2000 ? 8 : 4, step = bpp / 4, cols = w / 8;
  const double = a0 & 0x200 ? 1 : 0, boxW = w << double, boxH = h << double, group = (a1 >> 9) & 31;
  const param = k => { const v = oam[(group * 4 + k) * 4 + 3]; return (v > 32767 ? v - 65536 : v) / 256; };
  const pa = param(0), pb = param(1), pc = param(2), pd = param(3);
  let x = a1 & 511, y = a0 & 255;
  if (x >= GBA_W) x -= 512;
  if (y >= GBA_H) y -= 256;
  const indices = new Uint8Array(boxW * boxH);
  for (let by = 0; by < boxH; by++) for (let bx = 0; bx < boxW; bx++) {
    const lx = pa * (bx - (boxW >> 1)) + pb * (by - (boxH >> 1)) + (w >> 1);
    const ly = pc * (bx - (boxW >> 1)) + pd * (by - (boxH >> 1)) + (h >> 1);
    if (lx < 0 || lx >= w || ly < 0 || ly >= h) continue;
    const tx = Math.trunc(lx), ty = Math.trunc(ly);
    const tile = (a2 & 1023) + (mapping1D ? ((ty >> 3) * cols + (tx >> 3)) * step : (ty >> 3) * 32 + (tx >> 3) * step);
    indices[by * boxW + bx] = gbaTilePixel(vram, 2048 + (tile & 1023), bpp, (ty & 7) * 8 + (tx & 7));
  }
  return {x, y, w: boxW, h: boxH, bpp, bank: bpp === 4 ? a2 >>> 12 : 0, indices};
}

// Returns false if a visible map entry was rewritten during the frame.
function gbaBackgroundTiles(vram, bg, layer, out, dirtyUnits) {
  const cols = bg.size & 1 ? 64 : 32, rows = bg.size & 2 ? 64 : 32, unitsPerTile = bg.bpp / 4;
  const left = -(bg.x & 7), top = -(bg.y & 7);
  for (let ty = 0; ty < 21; ty++) {
    const my = ((bg.y >> 3) + ty) % rows;
    for (let tx = 0; tx < 31; tx++) {
      const mx = ((bg.x >> 3) + tx) % cols;
      const address = bg.screenBase + ((my >> 5) * (cols >> 5) + (mx >> 5)) * 2048 + ((my & 31) * 32 + (mx & 31)) * 2;
      if (dirtyUnits.size && dirtyUnits.has(address >> 5) && dirtyUnits.get(address >> 5) > Math.max(0, top + ty * 8)) return false;
      const entry = vram[address >> 1];
      const unit = (bg.charBase >> 5) + (entry & 1023) * unitsPerTile;
      if (unit + unitsPerTile > 2048) continue;              // backgrounds cannot read OBJ tiles
      out.push([unit, bg.bpp, layer, bg.bpp === 4 ? entry >>> 12 : 0, left + tx * 8, top + ty * 8, !!(entry & 1024), !!(entry & 2048)]);
    }
  }
  return true;
}

// Unrotated affine background: one byte per map entry, 256-colour tiles,
// (128 << size) pixels square; wraps around or is transparent outside.
function gbaAffineTiles(vram, bg, layer, out, dirtyUnits) {
  const side = 128 << bg.size, cols = side >> 3, left = -(((bg.refx % 8) + 8) % 8), top = -(((bg.refy % 8) + 8) % 8);
  for (let ty = 0; ty < 21; ty++) {
    for (let tx = 0; tx < 31; tx++) {
      let px = bg.refx + left + tx * 8, py = bg.refy + top + ty * 8;
      if (bg.wrap) { px = ((px % side) + side) % side; py = ((py % side) + side) % side; }
      else if (px < 0 || py < 0 || px >= side || py >= side) continue;
      const address = bg.screenBase + (py >> 3) * cols + (px >> 3);
      if (dirtyUnits.size && dirtyUnits.has(address >> 5) && dirtyUnits.get(address >> 5) > Math.max(0, top + ty * 8)) return false;
      const entry = (vram[address >> 1] >> ((address & 1) * 8)) & 255;
      const unit = (bg.charBase >> 5) + entry * 2;
      if (unit + 2 > 2048) continue;                          // backgrounds cannot read OBJ tiles
      out.push([unit, 8, layer, 0, left + tx * 8, top + ty * 8, false, false]);
    }
  }
  return true;
}

function gbaObjectTiles(oam, id, mapping1D, out) {
  const a0 = oam[id * 4], a1 = oam[id * 4 + 1], a2 = oam[id * 4 + 2];
  const [w, h] = OBJ_SIZES[a0 >>> 14][a1 >>> 14], bpp = a0 & 0x2000 ? 8 : 4;
  let x = a1 & 511, y = a0 & 255;
  if (x >= 256) x -= 512;
  if (y >= GBA_H) y -= 256;
  const flipX = !!(a1 & 0x1000), flipY = !!(a1 & 0x2000), cols = w / 8, rows = h / 8, step = bpp / 4;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const sx = flipX ? cols - 1 - cx : cx, sy = flipY ? rows - 1 - cy : cy;
      const tile = (a2 & 1023) + (mapping1D ? (sy * cols + sx) * step : sy * 32 + sx * step);
      out.push([2048 + (tile & 1023), bpp, 4, bpp === 4 ? a2 >>> 12 : 0, x + cx * 8, y + cy * 8, flipX, flipY, id]);
    }
  }
}

// Identity of a tile's pixels: two 32-bit FNV-1a hashes of its VRAM halfwords.
function gbaTileKey(vram, unit, bpp) {
  let h1 = 0x811c9dc5, h2 = 0x9747b28c;
  const start = unit * 16, end = start + bpp * 4;
  for (let i = start; i < end; i++) {
    const v = vram[i];
    h1 = Math.imul(h1 ^ v, 0x01000193); h2 = Math.imul(h2 ^ v ^ (h1 >>> 15), 0x5bd1e995);
  }
  return bpp + ':' + (h1 >>> 0).toString(36) + ':' + (h2 >>> 0).toString(36);
}

// Colour index (0 = transparent) of pixel p (0..63) of a tile.
function gbaTilePixel(vram, unit, bpp, p) {
  if (bpp === 4) return (vram[unit * 16 + (p >> 2)] >> ((p & 3) * 4)) & 15;
  const v = vram[unit * 16 + (p >> 1)];
  return p & 1 ? v >>> 8 : v & 255;
}

// Colours a layer is drawn with: BG or OBJ palette, brightness-adjusted
// while a fade targets that layer.
function gbaLayerColors(ppu, st, layer) {
  const type = layer === 4 ? 1 : 0;   // layer 5 = backdrop (BG palette)
  return st.bright[layer] ? ppu.adjusted[type] : ppu.palette[type];
}

// Palette as text, one 15-bit colour per 4 hex digits; the tile's colour key.
function gbaPaletteKey(colors, bank, bpp) {
  const first = bpp === 4 ? bank * 16 : 0, count = bpp === 4 ? 16 : 256;
  let key = '';
  for (let i = first; i < first + count; i++) key += (((colors[i] | 0) & 0xffff) + 0x10000).toString(16).slice(1);
  return key;
}

function gbaColor(c) {
  return '#' + (((c & 31) << 19 | ((c >> 5) & 31) << 11 | ((c >> 10) & 31) << 3) + 0x1000000).toString(16).slice(1).toUpperCase();
}

// ---------------------------------------------------------------------------
// Drawing (runs inside the cartridge)

let gbaSlots = null, gbaPaletteIds = null, gbaCanonical = null;
let gbaUnitKey = null, gbaUnitGen = null;
let gbaScratch = null, gbaScratchContext = null, gbaCellImage = null, gbaScratchCells = new Map();
const GBA_SCRATCH_CELLS = 128 * 128;

function gbaRenderInit() {
  gbaSlots = new Map(GBA_TILES.keys.map((key, slot) => [key, slot]));
  gbaPaletteIds = new Map(GBA_TILES.palettes.map((key, id) => [key, id]));
  gbaCanonical = GBA_TILES.palettes.map(key => {
    const colors = [];
    for (let i = 0; i < key.length; i += 4) colors.push(gbaColor(parseInt(key.substr(i, 4), 16)));
    return colors;
  });
  gbaUnitKey = [new Array(3072).fill(''), new Array(3072).fill('')];
  gbaUnitGen = [new Uint32Array(3072), new Uint32Array(3072)];
  gbaScratch = document.createElement('canvas');
  gbaScratch.width = 1024; gbaScratch.height = 1024;
  // Cells are written through an 8x8 ImageData (works natively and in browsers).
  gbaScratchContext = gbaScratch.getContext('2d');
  gbaCellImage = gbaScratchContext.createImageData(8, 8);
}

// Slot for the tile at a VRAM unit, re-identified only after VRAM writes.
function gbaTileSlot(ppu, unit, bpp) {
  const which = bpp === 8 ? 1 : 0;
  const gen = bpp === 8 ? Math.max(ppu.tileGen[unit], ppu.tileGen[unit + 1]) : ppu.tileGen[unit];
  if (gbaUnitGen[which][unit] !== gen || gbaUnitKey[which][unit] === '') {
    gbaUnitKey[which][unit] = gbaTileKey(ppu.vram, unit, bpp);
    gbaUnitGen[which][unit] = gen;
  }
  const slot = gbaSlots.get(gbaUnitKey[which][unit]);
  return slot === undefined ? -1 : slot;
}

// Recolour a tile into the scratch atlas and return its cell number.
function gbaScratchTile(ppu, unit, bpp, slot, paletteKey, liveColors) {
  const id = (slot >= 0 ? 's' + slot : gbaUnitKey[bpp === 8 ? 1 : 0][unit]) + '/' + paletteKey;
  let cell = gbaScratchCells.get(id);
  if (cell !== undefined) return cell;
  if (gbaScratchCells.size >= GBA_SCRATCH_CELLS) gbaScratchCells.clear();
  cell = gbaScratchCells.size;
  gbaScratchCells.set(id, cell);
  const sprite = slot >= 0 ? SPRITES[slot] : null, canonical = slot >= 0 ? gbaCanonical[GBA_TILES.palette[slot]] : null;
  const pixels = gbaCellImage.data, cx = (cell % 128) * 8, cy = Math.floor(cell / 128) * 8;
  for (let p = 0; p < 64; p++) {
    const index = gbaTilePixel(ppu.vram, unit, bpp, p);
    let color = index ? liveColors[index] : null;
    // Pixels changed in the sprite editor keep their edited colour.
    if (sprite) {
      const original = index ? canonical[index] : null, edited = sprite[p] ? sprite[p].toUpperCase() : null;
      if (edited !== original) color = edited;
    }
    const o = p * 4;
    if (color) {
      const rgb = parseInt(color.slice(1), 16);
      pixels[o] = rgb >> 16; pixels[o + 1] = (rgb >> 8) & 255; pixels[o + 2] = rgb & 255; pixels[o + 3] = 255;
    } else { pixels[o] = pixels[o + 1] = pixels[o + 2] = pixels[o + 3] = 0; }
  }
  gbaScratchContext.putImageData(gbaCellImage, cx, cy);
  return cell;
}

// Character skins (optional script skins, GBA_SKINS): a hardware sprite
// showing a skin's original tiles is drawn as one new picture from the
// sprite sheet instead of tile by tile (a sprite counts when most of its
// tiles are the skin's) - frames that reuse a tile in another
// place cannot break it. Entry: {keys: [tile keys], poses: [{sprite, when}],
// w, h} (w, h in 8-pixel cells; the picture faces right like the original
// unflipped frames). A pose's `when` lists tile keys that select it (e.g. the
// frames holding a weapon); otherwise poses without `when` alternate with
// the animation frame. A pose's `hold` keeps it for that many frames after it
// was last selected (frames in between that lack its tiles do not flicker).
//
// Animated skins use `anim` instead of `poses`: {idle: [sprites], walk:
// [sprites], jump: [sprites], fall: [sprites] (optional)} chosen from how the character moves in the
// level (screen position plus background scroll), the walk frames advancing
// every `step` pixels travelled; rising shows jump, falling shows fall.
// `gun: {when, hold, anim}` switches to another
// set while those tiles are shown (and `hold` frames after).
let gbaSkinIndex = null, gbaSkinFrame = 0;
function gbaSkinAnimate(skin, o, st) {
  // The front-most text background scrolls with the level.
  let camX = 0, camY = 0, best = 9;
  for (const bg of st.bgs) if (bg.enabled && !bg.affine && bg.priority < best) { best = bg.priority; camX = bg.x; camY = bg.y; }
  const m = skin.motion || (skin.motion = {x: null, y: null, walked: 0, still: 99, air: 0, ys: []});
  const wx = o.x + camX, wy = o.y + camY;
  if (m.x !== null) {
    let dx = wx - m.x;
    if (dx > 256) dx -= 512; else if (dx < -256) dx += 512;     // scroll wraps at 512
    if (Math.abs(dx) > 16) dx = 0;                              // teleport / room change
    m.walked += Math.abs(dx); m.still = dx ? 0 : m.still + 1;
  }
  m.ys.push(wy); if (m.ys.length > 4) m.ys.shift();
  const vy = m.ys[m.ys.length - 1] - m.ys[0];
  if (Math.abs(vy) >= 3) { m.air = 6; m.rising = vy < 0; } else m.air = Math.max(0, m.air - 1);
  m.x = wx; m.y = wy;
  let set = skin.anim;
  if (skin.gun) {
    if (o.keys.some(k => skin.gun.when.has(k))) skin.gun.until = gbaSkinFrame + (skin.gun.hold | 0);
    if (skin.gun.until >= gbaSkinFrame) set = skin.gun.anim;
  }
  if (m.air > 0) return (!m.rising && set.fall ? set.fall : set.jump)[0];
  if (m.still < 4) return set.walk[Math.floor(m.walked / (skin.step || 4)) % set.walk.length];
  return set.idle[Math.floor(gbaSkinFrame / 20) % set.idle.length];
}
function gbaSkinnedObjects(ppu, st, tiles) {
  const found = new Map();
  if (typeof GBA_SKINS !== 'object' || !GBA_SKINS.length) return found;
  if (!gbaSkinIndex) gbaSkinIndex = GBA_SKINS.map(s => ({...s, keys: new Set(s.keys),
    poses: (s.poses || []).map(p => ({...p, when: p.when ? new Set(p.when) : null, until: -1})),
    gun: s.gun ? {...s.gun, when: new Set(s.gun.when), until: -1} : null}));
  gbaSkinFrame++;
  const objects = new Map();
  for (const tile of tiles) {
    const object = tile[8];
    if (object === undefined) continue;
    let o = objects.get(object);
    if (!o) objects.set(object, o = {keys: [], x: tile[4], y: tile[5], flipX: tile[6]});
    o.x = Math.min(o.x, tile[4]); o.y = Math.min(o.y, tile[5]);
    const which = tile[1] === 8 ? 1 : 0;
    gbaTileSlot(ppu, tile[0], tile[1]);
    o.keys.push(gbaUnitKey[which][tile[0]]);
  }
  for (const [object, o] of objects) {
    for (const skin of gbaSkinIndex) {
      // Most of the sprite's tiles must be the character's (others share a few).
      if (o.keys.filter(k => skin.keys.has(k)).length * 2 < o.keys.length) continue;
      if (skin.anim) { found.set(object, {sprite: gbaSkinAnimate(skin, o, st), x: o.x, y: o.y, w: skin.w, h: skin.h, flipX: o.flipX, drawn: false}); break; }
      let pose = skin.poses.find(p => p.when && o.keys.some(k => p.when.has(k)));
      if (pose) pose.until = gbaSkinFrame + (pose.hold | 0);
      else pose = skin.poses.find(p => p.when && p.until >= gbaSkinFrame);
      if (!pose) {
        const plain = skin.poses.filter(p => !p.when);
        let hash = 0;
        for (const k of o.keys) for (let i = 0; i < k.length; i++) hash = (hash * 31 + k.charCodeAt(i)) | 0;
        pose = plain[Math.abs(hash) % plain.length];
      }
      found.set(object, {sprite: pose.sprite, x: o.x, y: o.y, w: skin.w, h: skin.h, flipX: o.flipX, drawn: false});
      break;
    }
  }
  return found;
}

// Rotated/scaled object: coloured with the live OBJ palette, transparent
// where its index is 0, drawn through its own scratch canvas.
let gbaAffineCanvas = null, gbaAffineContext = null;
function gbaDrawAffine(ppu, st, o) {
  if (o.x >= GBA_W || o.y >= GBA_H || o.x + o.w <= 0 || o.y + o.h <= 0) return;
  if (!gbaAffineCanvas) { gbaAffineCanvas = document.createElement('canvas'); gbaAffineCanvas.width = 128; gbaAffineCanvas.height = 128; gbaAffineContext = gbaAffineCanvas.getContext('2d'); }
  const colors = gbaLayerColors(ppu, st, 4), first = o.bpp === 4 ? o.bank * 16 : 0;
  const image = gbaAffineContext.createImageData(o.w, o.h), data = image.data;
  for (let i = 0; i < o.indices.length; i++) {
    const index = o.indices[i];
    if (!index) continue;
    const c = colors[first + index] | 0, d = i * 4;
    data[d] = (c & 31) << 3; data[d + 1] = ((c >> 5) & 31) << 3; data[d + 2] = ((c >> 10) & 31) << 3; data[d + 3] = 255;
  }
  gbaAffineContext.putImageData(image, 0, 0);
  ctx.drawImage(gbaAffineCanvas, 0, 0, o.w, o.h, o.x, o.y, o.w, o.h);
}

function gbaDrawCell(cell, x, y, flipX, flipY) {
  const sx = (cell % 128) * 8, sy = Math.floor(cell / 128) * 8;
  if (!flipX && !flipY) { ctx.drawImage(gbaScratch, sx, sy, 8, 8, x, y, 8, 8); return; }
  ctx.save(); ctx.translate(x + 4, y + 4); ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.drawImage(gbaScratch, sx, sy, 8, 8, -4, -4, 8, 8); ctx.restore();
}

// Draw the frame the machine just finished. Returns 'tiles' or 'frame'.
function gbaDrawFrame(machine, screen) {
  if (!gbaSlots) gbaRenderInit();
  const ppu = machine.ppu, st = ppu.state(), tiles = gbaFrameTiles(ppu, st);
  if (!tiles) {
    screen.data.set(machine.rgba);
    ctx.putImageData(screen, 0, 0);
    return 'frame';
  }
  ctx.fillStyle = gbaColor(gbaLayerColors(ppu, st, 5)[0]);
  ctx.fillRect(0, 0, GBA_W, GBA_H);
  const keys = new Map(), liveColors = new Map();
  const skinned = gbaSkinnedObjects(ppu, st, tiles);
  let nextAffine = 0;
  for (let i = 0; i < tiles.length; i++) {
    while (nextAffine < tiles.affine.length && tiles.affine[nextAffine].at === i) gbaDrawAffine(ppu, st, tiles.affine[nextAffine++]);
    const [unit, bpp, layer, bank, x, y, flipX, flipY, object] = tiles[i];
    if (object !== undefined && skinned.has(object)) {
      // A replaced character: its whole new picture, once, in its place.
      const skin = skinned.get(object);
      if (!skin.drawn) { skin.drawn = true; spr(skin.sprite, skin.x, skin.y, skin.w, skin.h, skin.flipX, false); }
      continue;
    }
    if (x <= -8 || y <= -8 || x >= GBA_W || y >= GBA_H) continue;
    const slot = gbaTileSlot(ppu, unit, bpp);
    const colors = gbaLayerColors(ppu, st, layer), keyId = layer * 32 + (bpp === 8 ? 16 : bank);
    let paletteKey = keys.get(keyId);
    if (paletteKey === undefined) { paletteKey = gbaPaletteKey(colors, bank, bpp); keys.set(keyId, paletteKey); }
    if (slot >= 0 && gbaPaletteIds.get(paletteKey) === GBA_TILES.palette[slot]) {
      spr(slot, x, y, 1, 1, flipX, flipY);
      continue;
    }
    let live = liveColors.get(keyId);
    if (!live) {
      const first = bpp === 4 ? bank * 16 : 0;
      live = [];
      for (let i = 0; i < (bpp === 4 ? 16 : 256); i++) live.push(gbaColor(colors[first + i]));
      liveColors.set(keyId, live);
    }
    gbaDrawCell(gbaScratchTile(ppu, unit, bpp, slot, paletteKey, live), x, y, flipX, flipY);
  }
  while (nextAffine < tiles.affine.length) gbaDrawAffine(ppu, st, tiles.affine[nextAffine++]);
  return 'tiles';
}
