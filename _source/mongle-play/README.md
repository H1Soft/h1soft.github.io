# Mongle web test

Static, client-only adaptation of the Mongle mobile test. Build with `node _source/mongle-play/build.mjs` from the repository root. Output is `/mongle/play/`.

- Korean, English, Japanese, Simplified/Traditional Chinese, Spanish, French, German, Portuguese, Indonesian, Vietnamese.
- Native 12/40 questions, scoring, and 16 result descriptions.
- Language query parameter survives result sharing. Answers are kept only in this browser; result URLs contain four percentages and mode, not answers.
- Characters are original font-free SVG outlines in one module, inserted with the view. No image request or decoder is needed per question.
- Subset WOFF2 fonts preserve supported original glyphs and use platform fallback for characters absent in the original fonts. See licenses.
- Content-hashed assets and a service worker scoped to `/mongle/play/`; it never intercepts sibling pages. Navigation checks the network and falls back to the cached shell. Updates replace only `mongle-play-*` caches.
- Browser sharing falls back to link copy; PNG export uses the same bundled character.

The source is under `_source/mongle-play`; do not hand-edit the generated `/mongle/play` output.
