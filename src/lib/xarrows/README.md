# Vendored fork of `react-xarrows`

Source for the arrows drawn in the process/activity graph editors and views. Vendored, not a
dependency — `react-xarrows` is deliberately absent from `package.json`.

## Fork point

Imported 2024-07-15 (`abcb921`) from `Eliav2/react-xarrows` `main`, which at the time was the
2.0.2 line (last release 2021-07-28; last upstream commit before the import, 2024-02-10, was
literally titled "deprecation warning").

Upstream then published **v2.1.0 on 2026-08-08**, its first release in five years: TypeScript 6
build, all runtime dependencies removed, a geometry fix, CI work.

## Do not naively re-sync onto upstream

**Upstream v2.1.0 still contains every runtime problem fixed here.** Merging it wholesale would
reintroduce all of them:

| | this fork | upstream v2.1.0 |
|---|---|---|
| `useState(initialParsedProps)` shared across all instances | per-instance factory | still shared |
| `useState(initialValVars)` shared across all instances | per-instance factory | still shared |
| `xSign ? 'left' : 'right'` (both values truthy) | compares `> 0` | still truthy-tests |
| `window` resize listener | one shared, rAF-coalesced | one per arrow, synchronous |
| `getTotalLength()` (forces layout) | gated on `animateDrawing` | ungated |
| dead `Xwrapper` update registry + unused second context | removed | n/a (different shape) |

What upstream has that this fork does not is build tooling — TS 6, zero runtime deps. Neither
applies here: we vendor the source rather than build a package, and `es-toolkit` is already a
project dependency.

Cherry-picked from v2.1.0: `Math.atan2(absDy, absDx)` in `GetPosition.ts`, which stops `NaN`
coordinates when start and end coincide. Only reachable via `path: 'straight'`, which this project
does not use (`arrowStyle` sets `path: 'grid'`) — taken as hardening.

If you do re-sync, diff against the table above first and re-apply each row.

## Local conventions

- **eslint ignores this directory** (`eslint.config.mjs`) — upstream style, not ours.
- **prettier does NOT ignore it.** Never run the repo-wide `yarn prettier` script against this
  tree; it would reformat all ~1700 vendored lines. Format edits by hand, or scope prettier to the
  specific file.
- `tsc` **does** cover it, so type errors here fail `yarn check`.

## Known, still open

- `getElemPos` calls `getBoundingClientRect` during the **render** phase for both endpoints of
  every arrow, on every render (`useXarrowProps.ts`). Moving it into a layout effect requires
  re-sequencing the `shouldUpdatePosition` handshake — the position effect in `Xarrow.tsx` runs
  after `useXarrowProps`' effects and would consume stale `valVars`, leaving arrows at old
  coordinates. Needs browser verification, not just a typecheck.
- `Xwrapper`'s context value is referentially stable, so calling it re-renders `Xwrapper` alone and
  React bails out of the unchanged children. Arrows stay in sync through their own ResizeObserver
  and the render-phase position read instead. Expected from reading React's bailout rules, not
  measured.
