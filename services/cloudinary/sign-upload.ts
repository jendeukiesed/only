import "server-only";
import { cloudinary } from "@/lib/cloudinary/config";

/**
 * Client-side (browser) uploads go straight to Cloudinary rather than
 * proxying image bytes through our own server — cheaper and faster. But
 * that means the client needs a short-lived signature rather than the raw
 * API secret. This generates one signed params bundle per upload request.
 */
export function createUploadSignature(folder: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder,
  };
}
