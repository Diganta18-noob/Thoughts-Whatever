export interface UploadResponse {
  ok: boolean;
  url?: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  error?: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}
