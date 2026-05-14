import type { AircraftProfileMetadata } from "@/types/aircraft-profile";

const HEXDB_CACHE = { revalidate: 86_400 } as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildOperatorOrOwner(data: Record<string, unknown>): string | null {
  const owners = readString(data.RegisteredOwners);
  const flag = readString(data.OperatorFlagCode);
  if (owners && flag) return `${owners} (${flag})`;
  if (owners) return owners;
  if (flag) return flag;
  return null;
}

function parseHexDbMetadata(
  hexLower: string,
  data: unknown,
): AircraftProfileMetadata | null {
  if (!isRecord(data)) return null;

  const status = readString(data.status);
  if (status === "404") return null;

  const errorText = readString(data.error);
  if (errorText && /not found/i.test(errorText)) return null;

  const registration = readString(data.Registration);
  const manufacturer = readString(data.Manufacturer);
  const aircraftTypeCode = readString(data.ICAOTypeCode);
  const aircraftTypeName = readString(data.Type);
  const operatorOrOwner = buildOperatorOrOwner(data);

  if (
    !registration &&
    !manufacturer &&
    !aircraftTypeCode &&
    !aircraftTypeName &&
    !operatorOrOwner
  ) {
    return null;
  }

  return {
    icao24: hexLower,
    registration,
    manufacturer,
    aircraftTypeCode,
    aircraftTypeName,
    operatorOrOwner,
  };
}

/**
 * Fetches static aircraft metadata from HexDB.
 * Returns null when the aircraft is unknown or the response cannot be used.
 */
export async function fetchHexDbAircraftMetadata(
  hexLower: string,
): Promise<AircraftProfileMetadata | null> {
  try {
    const url = `https://hexdb.io/api/v1/aircraft/${encodeURIComponent(hexLower)}`;
    const response = await fetch(url, {
      next: HEXDB_CACHE,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();

    if (isRecord(data)) {
      const status = readString(data.status);
      if (status === "404") {
        return null;
      }
    }

    return parseHexDbMetadata(hexLower, data);
  } catch {
    return null;
  }
}
