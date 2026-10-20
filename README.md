# turbo8-catalog
Turbo8 community cartridge catalog and versioned downloads

## Automated submission checks

The `Review cartridge` workflow executes tooling from trusted `main`, not from
the submitted PR. Submitted JavaScript is syntax-checked, never executed.

- **PR identity and scope:** the official repository's `main` branch, matching
  immutable repository identity, unchanged PR head during validation, complete
  changed-file list, exactly one cartridge directory, at most 128 changed files.
- **File safety and budgets:** safe relative paths (up to 160 characters), no
  case-insensitive collisions, symlinks, executable Git entries or submodules;
  at most 128 files, 16 MiB per fetched file and 64 MiB total expanded bytes.
  Only `submission.json` and supported files under `cartridge/` are accepted.
- **Submission metadata:** schema 1; matching cartridge ID and verified PR
  author's numeric GitHub ID; title up to 120 characters, summary and changes
  up to 2,000 characters each (nonblank, no NUL); numeric `MAJOR.MINOR.PATCH`
  version. Updates retain author/ID and increase the version. Retired
  `remix_of`, `code_license`, `assets_license` and `controls` fields are ignored.
  Submission metadata is limited to 16 KiB and the cartridge index to 64 KiB.
- **Canvas and cover:** index title/version match submission metadata; canvas
  dimensions are integral, 64–512 each, at most 196,608 pixels and at most 3:1
  aspect ratio. Missing resolution defaults to 256×144. Cover must be a
  256×144 PNG no larger than 128 KiB.
- **Scripts:** 1–32 unique, safely named `.js` files, all present, each at most
  2 MiB, valid UTF-8 and accepted by `node --check --input-type=commonjs`.
- **Embedded images:** at most 64 uniquely named declared images with matching
  `images/<id>.png` paths and dimensions. Each is at most 8 MiB, 4096×4096 and
  4,194,304 pixels; combined limits are 16 MiB and 8,388,608 pixels.
- **Sprites and resources:** palette has 1–256 `#RRGGBB` colors. JSON sprites
  have at most 4,096 sprites, each up to 64 null/color pixels; otherwise a PNG
  sprite sheet is required, at most 4096 per dimension and 262,144 pixels.
  Maps/SFX/music, when present, must be arrays of objects with limits
  64/256/256. All accepted JSON files must parse.
- **Virtual inputs:** optional `virtualControls.json` contains a boolean.
  Optional `virtualButtons.json` contains up to 10 unique action names from
  `A`, `B`, `SELECT`, `START`, `X`, `Y`, `LB`, `RB`, `LT`, `RT`. An empty array
  is valid (joystick only); omission preserves the editor's default A/B.
  These are separate fields, not alternative spellings of one field.
- **Review artifact:** deterministic cartridge ZIP no larger than 32 MiB,
  accompanied by a receipt binding author, cartridge/version, PR head,
  cartridge tree revision, byte count and SHA-256.

PNG checks cover signature, chunk boundaries, CRCs, ending and dimensions;
they are not a full image-decoder test. Resource checks are not comprehensive
schemas for every nested map/audio/effect field. Automatic checks do not prove
gameplay correctness, runtime safety, performance, copyright ownership or
content suitability; maintainer playtesting and review remain necessary.

## Publication checks

After merge, publication runs the tooling tests and validates cartridge data
again. Versioned Release assets are immutable: retries compare bytes rather
than overwrite them. The public ZIP download must match before its catalog
entry is exposed, and the deployed Pages catalog must match the expected
artifact. A passing review check alone does not publish or merge a cartridge.
