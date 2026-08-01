# Transcription Troubleshooting Guide

## Common Errors & Solutions

### "Your session has expired. Please refresh the page and sign in again."

**Cause:** Your admin session has timed out due to inactivity.

**Solution:**
1. Press `Ctrl+R` (Windows) or `Cmd+R` (Mac) to refresh the page.
2. If redirected to the login screen, sign in again with your admin credentials.
3. Return to the piece editor and try transcription again.

---

### "Groq transcription service not configured"

**Cause:** `GROQ_API_KEY` is not set in environment variables.

**Solution (for administrators):**
1. Go to **Vercel Dashboard ➔ Project Settings ➔ Environment Variables**.
2. Add `GROQ_API_KEY` (Get a free key from [console.groq.com](https://console.groq.com)).
3. Redeploy the application.
4. Refresh the piece editor and try transcription again.

---

### "Unsupported audio format"

**Cause:** Audio file format is not supported by the transcriber.

**Supported Formats:** MP3 (`.mp3`), M4A (`.m4a`), WAV (`.wav`), OGG (`.ogg`), WebM (`.webm`).

**Solution:**
1. Convert your audio using an online converter (e.g. [CloudConvert](https://cloudconvert.com/audio-converter)) or Audacity.
2. Export as **MP3** (128kbps recommended).
3. Upload the converted `.mp3` file.

---

### "Audio file too large (must be under 25MB)"

**Cause:** Audio file exceeds the 25MB size limit.

**Solution:**
1. Open your audio file in Audacity or an audio editor.
2. Export as MP3 at 128kbps (reduces file size by 70–80%).
3. Or split long voiceovers into 5–10 minute segments and transcribe each part separately.

---

### "Groq rate limit reached"

**Cause:** The free Groq Developer Tier limit was temporarily reached.

**Solution:**
1. Wait 30 seconds for the rate limit window to reset.
2. Click the **"Retry Transcription"** button.

---

## Still Having Issues?

1. **Check browser console:**
   - Press `F12` ➔ **Console** tab.
   - Look for red error messages.
2. **Contact Admin / Support:**
   - Email: `admin@thoughts-whatever.com`
