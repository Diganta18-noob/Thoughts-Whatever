# Admin Media Library & Production Asset Manager

- `/admin/media` provides a centralized asset management suite supporting images (16:9 landscape, 9:16 portrait, 1:1 square, and SVG vectors), voice narration audio, documentary video, PDF, text, DOCX, and EPUB.
- **Cross-Platform Upload Picker**: Uses explicit extensions (`.mp3,.m4a,.wav,.aac,.ogg,.flac,.webm,.mp4,.mov,.jpg,.jpeg,.png,.webp,.avif,.gif,.svg,.pdf,.txt,.docx,.epub`) alongside MIME types so Windows native file dialogs do not omit audio or image files. Server-side validation infers MIME types if the browser provides generic or empty types.
- **Audio & Video Previews**: Built-in `AudioPreviewPlayer` with live playback controls, duration, interactive time scrubbing, and animated waveform bars. Grid cards support inline instant auditioning.
- **Orientation & Format Filters**: Images and assets can be filtered by orientation (16:9 Landscape, 9:16 Portrait, 1:1 Square) or format (SVG Vectors). Cards display aspect-aware letterboxed previews and orientation badges so landscape photos and portrait covers are immediately distinct.
- **Direct Cloud Uploads**: File uploads use signed, direct-to-Cloudinary uploads to bypass Vercel's 4.5 MB request payload limits. Large base64 data URLs are strictly blocked from being persisted to PostgreSQL.
- **Editor Integrations**:
  - `PieceEditor`: Narration (audio) field includes a "Choose audio from Media Library" picker that auto-fills `audioUrl` and duration (`audioSec`). Cover image (9:16) and thumbnail (16:9) pass orientation hints to the picker.
  - `TaxonomyManager`: Author portrait photo and series cover/banner art support direct Media Library selection.
  - `ReferenceAssetModal` & `ReferenceEditorModal`: Reference digital assets (audio, PDFs, transcripts, plates) integrate seamlessly with the Media Library.
- **Usage Tracker & Protection**: Accurately tracks references across Piece (`coverImage`, `thumbnailImage`, `ogImage`, `audioUrl`, `videoUrl`, `bodyBn`), Series (`coverImage`), Author (`portrait`), ReferenceEdition (`coverImage`), and ReferenceAsset (`fileUrl`). Assets currently referenced by live content cannot be deleted until references are removed.
- **Dynamic Variants**: Provides on-demand focal-point centered crops for 16:9 Landscape, 9:16 Portrait, 1:1 Square, and 1.91:1 Social Share without modifying the original asset.
