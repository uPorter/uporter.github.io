# Seam Tools — local Porty preview

The repository was cloned from `uPorter/uporter.github.io`. It contains the compiled public site and its three demos.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5174/. `npm run check` checks the added JavaScript syntax.

Porty sits to the left of “Seam Tools” in a 64 px column with a 14 px layout gap. His head follows the pointer, looks around while idle and briefly changes expression when clicked or activated with Enter/Space. Reduced motion shows the neutral pose, with the expression change still available on activation. Animation pauses outside the viewport or when the tab is hidden.

`porty/porty-head.js` is the standalone controller adapted from the existing Porty React component. `porty/mount.js` adds it to the header after the compiled React app mounts. `porty/porty.css` controls placement; the original generated bundles are unchanged.

`porty/porty-sprites.webp` losslessly packs only the 18 original frames needed here: neutral, sad, then 16 clockwise directions. Each cell is 192 × 208, in a 6 × 3 atlas. No new face images were generated.

The same files run locally and on GitHub Pages. The original bundled site remains intact, and `.seam-root-manifest` includes the added browser assets. To retain the change across future upstream site builds, move the controller and header placement into the original source app, or include these readable files in its publishing step.
