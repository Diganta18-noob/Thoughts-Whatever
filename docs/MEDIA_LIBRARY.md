# Admin Media Library

- `/admin/media` supports images (including landscape/portrait and SVG), audio, video, PDF, text, DOCX and EPUB. File type, extension and size are checked before a signed direct-to-Cloudinary upload. Audio uses Cloudinary's `video` resource type. The server verifies Cloudinary's response signature and stored resource before creating a `Media` row; files are never stored as data URLs.
- Required environment: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. If missing, uploads fail clearly. Existing URLs remain valid. Uploads over 95 MB need a future chunked-upload flow.
- The additive nullable `Media.metadata` JSON field holds duration, cloud public ID, credit, license, source, tags, and focal coordinates. Existing rows require no backfill. Run `npx prisma db push` before deploying code that reads this field.
- Image variant links request Cloudinary crops on demand; originals stay untouched. Editors can reuse library images, and Reference asset forms can select audio and documents. Reference rights checks still apply.
- Deletion checks usage links and live Piece, Series, Author and Reference references. Used files cannot be force-deleted from the library. Sync Usage Tracker refreshes links and removes stale links after editor changes.
