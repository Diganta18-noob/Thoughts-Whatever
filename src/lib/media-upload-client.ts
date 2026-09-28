import { resolveMimeType, validateMediaFile } from "@/lib/media-policy";

type Signature = { cloudName: string; apiKey: string; folder: string; timestamp: number; signature: string; resourceType: "image" | "video" | "raw" };
type CloudResult = { public_id: string; resource_type: string; version: number; signature: string; error?: { message: string } };

async function jsonOrError(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || `Upload failed (${response.status})`);
  return data;
}

export async function uploadMediaDirect(file: File, onProgress: (percent: number) => void) {
  const mimeType = resolveMimeType(file.name, file.type);
  const error = validateMediaFile(file.name, mimeType, file.size);
  if (error) throw new Error(error);
  const signature = await jsonOrError(await fetch("/api/admin/media/upload-signature", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, mimeType, sizeBytes: file.size }),
  })) as Signature;

  const result = await new Promise<CloudResult>((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", signature.apiKey);
    form.append("timestamp", String(signature.timestamp));
    form.append("folder", signature.folder);
    form.append("signature", signature.signature);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/${signature.resourceType}/upload`);
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.min(95, Math.round(event.loaded / event.total * 95))); };
    xhr.onerror = () => reject(new Error("Cloud upload failed. Check your connection and retry."));
    xhr.onload = () => {
      let data: CloudResult;
      try { data = JSON.parse(xhr.responseText); } catch { reject(new Error("Invalid cloud upload response")); return; }
      if (xhr.status < 200 || xhr.status >= 300) reject(new Error(data.error?.message || "Cloud upload failed"));
      else resolve(data);
    };
    xhr.send(form);
  });

  const completion = await jsonOrError(await fetch("/api/admin/media/upload-complete", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, mimeType, publicId: result.public_id,
      resourceType: result.resource_type, version: result.version, signature: result.signature }),
  }));
  onProgress(100);
  return completion.media;
}
