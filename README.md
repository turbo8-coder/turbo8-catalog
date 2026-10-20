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
  up to 2,000 characters each (optional, may be empty, no NUL); numeric `MAJOR.MINOR.PATCH`
  version. Updates retain author/ID and increase the version. Retired
  `remix_of`, `code_license`, `assets_license` and `controls` fields are ignored.
  Unknown metadata is accepted; both files use the shared 16 MiB per-file budget.
- **Canvas and cover:** index title/version match submission metadata; canvas
  dimensions are integral, 64–512 each, at most 196,608 pixels and at most 3:1
  aspect ratio. Missing resolution defaults to 256×144. Cover must be a
  256×144 PNG no larger than 128 KiB.
- **Scripts:** 1–32 unique, safely named `.js` files, all present, each at most
  16 MiB, valid UTF-8 and accepted by `node --check --input-type=commonjs`.
  Editor-compatible default names, omitted extensions, Unicode, spaces and
  nested paths are supported, subject to safe distribution-path checks.
- **Embedded images:** at most 64 uniquely named declared images with matching
  `images/<id>.png` paths and dimensions. Each is at most 8 MiB, 4096×4096 and
  4,194,304 pixels; combined limits are 16 MiB and 8,388,608 pixels.
- **Sprites and resources:** palette has 1–256 `#RRGGBB` colors. JSON sprites
  have at most 4,096 sprites, each up to 64 null/color pixels; otherwise a PNG
  sprite sheet is required within the editor's image budget.
  Maps/SFX/music follow editor normalization and nested validation, including
  map layers/tile IDs, music steps/channels and PICO-8 audio.
  Effects use editor-generated parameter types/ranges. All JSON must parse.
  Bounded optional JSON extensions are preserved with compatibility warnings.
  Future index version labels alone do not reject editor-compatible data.
  Unknown binary files, undeclared scripts and nested JSON names shadowing root
  resources remain rejected.
- **Virtual inputs:** optional `virtualControls.json` contains a boolean.
  Optional `virtualButtons.json` contains up to 10 unique action names from
  `A`, `B`, `SELECT`, `START`, `X`, `Y`, `LB`, `RB`, `LT`, `RT`. An empty array
  is valid (joystick only); omission preserves the editor's default A/B.
  These are separate fields, not alternative spellings of one field.
- **Review artifact:** deterministic cartridge ZIP no larger than 32 MiB,
  accompanied by a receipt binding author, cartridge/version, PR head,
  cartridge tree revision, byte count and SHA-256.

PNG checks cover signature, chunk boundaries, CRCs, ending and dimensions;
they are not a full image-decoder test. Automatic checks do not prove
gameplay correctness, runtime safety, performance, copyright ownership or
content suitability; maintainer playtesting and review remain necessary.

## Contract maintenance

`editor_contract.json` is generated from unchanged editor rules;
`editor_validation.py` mirrors loader algorithms. The source project's
`tools/online-submissions/` provides contract generation, source-fingerprint
checks, real-editor differential tests and published/local corpus regression.
Algorithm changes require mirror updates and parity cases, not only refreshed
limits. Deploy the contract, mirror, pipeline, fixtures and tests together.
Both review and publication run trusted tooling tests.

Existing editor builds retain an ASCII-only submission-path preflight even
though their loader accepts broader names. Cloud compatibility does not remove
that client limitation.

## Publication checks

Entries carry `updated_at` from the current ZIP's public Release asset creation
time, not the directory build time. Catalog order is newest first with title/ID
tie-breaks, including for older clients. Updated clients also offer alphabetical
sorting. Optional ranking metadata can be extended without changing ZIPs.

After merge, publication runs the tooling tests and validates cartridge data
again. Versioned Release assets are immutable: retries compare bytes rather
than overwrite them. The public ZIP download must match before its catalog
entry is exposed, and the deployed Pages catalog must match the expected
artifact. A passing review check alone does not publish or merge a cartridge.

Draft recovery pages the authenticated release list, including older drafts.
New drafts are taken directly from the creation response and published by
numeric Release ID. Drafts are never queried through the public tag endpoint.
