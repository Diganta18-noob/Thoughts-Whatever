# Content upload automation

Run `npm run content:process -- --only "<solo title>"` to publish one file from `Content/solo/` without updating older series or solo posts. Add its reel URL and UTC publication date to `KNOWN_REEL_METADATA` in `scripts/process-content.ts` first. Matching portrait and landscape images are read from `Content/Thumnail/Solo/` and `Content/Thumnail Landscape/Solo/`.

Targeted uploads require both images to have durable Cloudinary URLs before the article is written. Re-run with `--force` to refresh the article body and captions; already uploaded images are reused. Verify the resulting database record and public `/documentary/<slug>` page.

Uploads require Cloudinary; the pipeline no longer stores base64 image URLs. After content processing, it syncs `Media` and `MediaUsage` records and records the dimensions and byte size returned by Cloudinary. Published posts receive `reviewStatus=published` (or `scheduled` for a future date). English titles are entered in `ENGLISH_TITLES`; unknown Bengali titles leave `titleEn` empty until reviewed.

Run `npx tsx scripts/repair-recent-content.ts` to idempotently repair the September 2026 batch, including Media Library entries and actual Cloudinary dimensions. Landscape originals remain unchanged; public landscape cards display the full image without cropping text.
