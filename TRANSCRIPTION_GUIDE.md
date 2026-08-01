# Audio Transcription Guide — Thoughts Whatever

## Overview
The Admin Portal includes integrated audio transcription powered by the **OpenAI Whisper API**. This feature allows editors to upload Instagram Reel voiceovers, audio narrations, or dictations, and automatically transcribe mixed Bengali-English speech into formatted Markdown text for publishing.

---

## Features
- **Supported Formats**: `.mp3`, `.m4a`, `.wav`, `.webm`, `.ogg` (up to 25MB).
- **Mixed-Language AI Model**: Powered by OpenAI `whisper-1` with support for Bengali (বাংলা) and mixed Bengali-English speech.
- **Auto-Fill Integration**: Appends transcribed text directly into the `Body (Markdown)` field.
- **Audio Storage**: Automatically uploads audio files to Cloudinary for optional narration playback on public pieces.
- **Live Cost Calculation**: Displays estimated Whisper API cost before transcribing ($0.006 per minute).

---

## Step-by-Step Usage

### 1. Open the Piece Editor
Navigate to **Admin Portal -> Pieces -> Create New Piece** (or Edit existing piece).

### 2. Open Transcriber
Above the **Body (Markdown)** textarea, click the **"🎙️ Transcribe Audio Narration / Reel"** button.

### 3. Upload Audio File
- Drag and drop your audio file into the box, or click to browse.
- Supported formats: MP3, M4A, WAV, WebM, OGG.
- Max file size: 25MB.

### 4. Transcribe
- Review the estimated duration and cost.
- Click **"Transcribe & Auto-fill Body"**.
- Wait for processing (usually 15-45 seconds for a typical Reel voiceover).

### 5. Review & Publish
- The transcribed text will automatically append to the **Body (Markdown)** field.
- If audio storage is enabled, the Cloudinary audio URL will also populate the **Narration (Audio)** field in the Media panel.
- Review and refine the text in the editor before saving or publishing.

---

## Cost Reference
- **Whisper API Pricing**: `$0.006` per minute ($0.36 per hour).
- **1-minute Reel**: ~$0.006
- **5-minute Narration**: ~$0.030
- **10-minute Audio**: ~$0.060

---

## Environment Variable Setup
To enable live audio transcription in production, ensure your Vercel or local environment contains:
```env
OPENAI_API_KEY="sk-proj-your-openai-api-key"
```
