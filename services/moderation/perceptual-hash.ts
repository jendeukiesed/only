import "server-only";
import sharp from "sharp";
import { db } from "@/lib/db/prisma";

/**
 * A classic "average hash" (aHash): shrink to 8x8 grayscale, compare each
 * pixel to the mean, and pack the 64 above/below-average bits into a hex
 * string. It's a deliberately simple, dependency-light perceptual hash —
 * `sharp` is already a project dependency for image handling, so this adds
 * zero new packages — and it's robust to the kind of re-compression/
 * re-export a seller might do when re-uploading the same photo (unlike a
 * cryptographic hash of the raw bytes, which changes if a single pixel or
 * the JPEG quality setting changes).
 */
export async function computeImageHash(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to fetch image for hashing: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());

  const { data } = await sharp(buffer)
    .resize(8, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Array.from(data);
  const mean = pixels.reduce((sum, p) => sum + p, 0) / pixels.length;

  let bits = "";
  for (const pixel of pixels) {
    bits += pixel >= mean ? "1" : "0";
  }

  // Pack the 64-bit binary string into 16 hex characters for compact
  // storage/indexing in Photo.imageHash.
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

/** Hamming distance between two same-length hex hashes (i.e. how many of
 *  the 64 bits differ) — 0 means pixel-identical-at-8x8, and empirically
 *  anything under ~10 is "almost certainly the same photo" for aHash. */
function hammingDistance(hashA: string, hashB: string): number {
  if (hashA.length !== hashB.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    const diff = parseInt(hashA[i]!, 16) ^ parseInt(hashB[i]!, 16);
    distance += diff.toString(2).split("1").length - 1;
  }
  return distance;
}

const DUPLICATE_THRESHOLD = Number(process.env.DUPLICATE_HASH_THRESHOLD ?? 8);

/**
 * Checks a newly-computed hash against every other photo's hash on the
 * platform (scoped to non-withdrawn photos) and returns the closest match
 * if it's within the duplicate threshold. Called once at upload time
 * (see actions/seller/upload.ts) — cheap enough at this product's scale to
 * do as a full table scan; if the catalog grows into the hundreds of
 * thousands, this would want an actual nearest-neighbor index instead.
 */
export async function findLikelyDuplicate(
  hash: string,
  excludePhotoId?: string,
): Promise<{ photoId: string; sellerId: string; distance: number } | null> {
  const candidates = await db.photo.findMany({
    where: {
      imageHash: { not: null },
      status: { not: "WITHDRAWN" },
      ...(excludePhotoId ? { id: { not: excludePhotoId } } : {}),
    },
    select: { id: true, sellerId: true, imageHash: true },
  });

  let closest: { photoId: string; sellerId: string; distance: number } | null = null;
  for (const candidate of candidates) {
    if (!candidate.imageHash) continue;
    const distance = hammingDistance(hash, candidate.imageHash);
    if (distance <= DUPLICATE_THRESHOLD && (!closest || distance < closest.distance)) {
      closest = { photoId: candidate.id, sellerId: candidate.sellerId, distance };
    }
  }
  return closest;
}
