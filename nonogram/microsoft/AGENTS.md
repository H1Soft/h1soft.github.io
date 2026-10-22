# Microsoft Store build isolation

The versioned directories here are immutable, destination-bound Microsoft Store PWA payloads. Never inject public-site analytics, SEO elements, other-store SDKs, or runtime patches into an existing version.

Use a new version and rebuild from the release overlays for changes. Check the exact artifact path and SHA-256 recorded in /Users/heewon.kim/ProjectETC/MultiStore-2026-10-20/Microsoft-Store/nonogram/status.json and upload-plan.json before packaging or uploading.

This is not the Apps in Toss, CrazyGames, Poki, Android, or iOS build. Never use a highest-version/newest-file heuristic or copy another store's package into this directory.

Source: user-confirmed Nonogram GitHub main af4e6e51ef4f2b0f924a9e882ac7e64c2422e8da. Native version metadata remains unchanged; Windows packaging has its own version and identity.
