# Hero Dot Matrix (OGL / WebGL)

`../hero-dotmatrix.js` is the bundled, self-contained build of
`hero-dotmatrix.src.js` — the Originkit "Dot Matrix" component ported from
React to vanilla, with OGL inlined (no runtime CDN). It renders a flowing
perlin field sampled into a matrix of "SM" glyphs in the brand palette, and
mounts into `#hero-dot` in the hero. Animation is gated to in-view +
tab-visible, and respects prefers-reduced-motion (one static frame).

## Rebuild
```
npm i ogl@1 esbuild@0.24
esbuild hero-dotmatrix.src.js --bundle --minify --format=iife \
  --define:process.env.NODE_ENV='"production"' --outfile=../hero-dotmatrix.js
```
