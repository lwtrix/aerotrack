import type { AircraftProfilePhoto } from "@/types/aircraft-profile";

const PLANESPOTTERS_CACHE = { revalidate: 86_400 } as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readThumbnailSrc(container: unknown): string | null {
  if (!isRecord(container)) return null;
  const src = container.src;
  if (typeof src !== "string" || !src.startsWith("http")) return null;
  return src;
}

function readPhotographerName(photo: Record<string, unknown>): string | null {
  const direct = photo.photographer;
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct.trim();
  }
  if (isRecord(direct)) {
    const name =
      direct.displayName ??
      direct.name ??
      direct.username ??
      direct.userName;
    if (typeof name === "string" && name.trim().length > 0) {
      return name.trim();
    }
  }

  const user = photo.user;
  if (isRecord(user)) {
    const username = user.username;
    if (typeof username === "string" && username.trim().length > 0) {
      return username.trim();
    }
  }

  const author = photo.author;
  if (typeof author === "string" && author.trim().length > 0) {
    return author.trim();
  }

  return null;
}

function readPhotoPageUrl(photo: Record<string, unknown>): string | null {
  const candidates = [photo.link, photo.url, photo.href, photo.photoUrl];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.startsWith("http")) {
      return candidate;
    }
  }
  return null;
}

function extractCompliantPhoto(
  photos: unknown[],
  photoSource: "registration" | "hex",
): AircraftProfilePhoto | null {
  for (const entry of photos) {
    if (!isRecord(entry)) continue;

    const imageUrl =
      readThumbnailSrc(entry.thumbnail_large) ??
      readThumbnailSrc(entry.thumbnail);

    const photoPageUrl = readPhotoPageUrl(entry);
    const photographerCredit = readPhotographerName(entry);

    if (
      imageUrl &&
      photoPageUrl &&
      photographerCredit &&
      photographerCredit.length > 0
    ) {
      return {
        imageUrl,
        photoPageUrl,
        photographerCredit,
        photoSource,
      };
    }
  }

  return null;
}

async function fetchPlanespottersPhotosList(
  url: string,
): Promise<unknown[] | null> {
  try {
    const response = await fetch(url, {
      next: PLANESPOTTERS_CACHE,
    });

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();
    if (!isRecord(data)) return null;

    const photos = data.photos;
    if (!Array.isArray(photos) || photos.length === 0) {
      return null;
    }

    return photos;
  } catch {
    return null;
  }
}

export type PlanespottersPhotoLookupInput = {
  hex: string;
  registration: string | null;
};

/**
 * Resolves a compliant Planespotters photo: registration endpoint first (when
 * registration is known), then hex.
 */
export async function fetchPlanespottersPhotoForAircraft({
  hex,
  registration,
}: PlanespottersPhotoLookupInput): Promise<AircraftProfilePhoto | null> {
  const hexUpper = hex.trim().toUpperCase();
  const normalizedReg = registration?.trim() ?? "";

  if (normalizedReg.length > 0) {
    const regUrl = `https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(normalizedReg)}`;
    const regPhotos = await fetchPlanespottersPhotosList(regUrl);
    if (regPhotos) {
      const fromReg = extractCompliantPhoto(regPhotos, "registration");
      if (fromReg) return fromReg;
    }
  }

  const hexUrl = `https://api.planespotters.net/pub/photos/hex/${encodeURIComponent(hexUpper)}`;
  const hexPhotos = await fetchPlanespottersPhotosList(hexUrl);
  if (!hexPhotos) return null;

  return extractCompliantPhoto(hexPhotos, "hex");
}

/**
 * Hex-only lookup (registration-first resolver with no registration).
 */
export async function fetchPlanespottersPhoto(
  hexUpper: string,
): Promise<AircraftProfilePhoto | null> {
  return fetchPlanespottersPhotoForAircraft({
    hex: hexUpper,
    registration: null,
  });
}
