/**
 * Cloudinary URLs are transformable by inserting a transformation string
 * right after `/upload/` — e.g. `.../upload/e_blur:2000/v123/photo.jpg`.
 * No SDK round-trip needed, these are computed client- and server-side
 * from the plain secure_url Cloudinary returns after upload.
 */
export function buildBlurredUrl(secureUrl: string, strength = 2000): string {
  return insertTransform(secureUrl, `e_blur:${strength}`);
}

export function buildThumbnailUrl(secureUrl: string, width = 400): string {
  return insertTransform(secureUrl, `w_${width},c_fill,q_auto,f_auto`);
}

function insertTransform(url: string, transform: string): string {
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const insertAt = idx + marker.length;
  return `${url.slice(0, insertAt)}${transform}/${url.slice(insertAt)}`;
}
