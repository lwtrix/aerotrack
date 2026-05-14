import { fetchHexDbAircraftMetadata } from "@/services/hexdb";
import { normaliseIcao24Param } from "@/services/opensky";
import { fetchPlanespottersPhotoForAircraft } from "@/services/planespotters";
import type {
  AircraftProfile,
  AircraftProfileMetadata,
  AircraftProfilePhoto,
} from "@/types/aircraft-profile";

/**
 * Loads HexDB metadata, then resolves a Planespotters photo (registration first,
 * then hex). Never throws for third-party failures; returns null segments instead.
 */
export async function getAircraftProfileByIcao24(
  icao24: string,
): Promise<AircraftProfile> {
  const normalized = normaliseIcao24Param(icao24);
  if (!normalized) {
    return { metadata: null, photo: null };
  }

  const hexLower = normalized;
  const hexUpper = normalized.toUpperCase();

  let metadata: AircraftProfileMetadata | null = null;
  try {
    metadata = await fetchHexDbAircraftMetadata(hexLower);
  } catch {
    metadata = null;
  }

  let photo: AircraftProfilePhoto | null = null;
  try {
    photo = await fetchPlanespottersPhotoForAircraft({
      hex: hexUpper,
      registration: metadata?.registration ?? null,
    });
  } catch {
    photo = null;
  }

  return { metadata, photo };
}
