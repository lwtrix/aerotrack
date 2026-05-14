export type AircraftProfilePhoto = {
  imageUrl: string;
  photoPageUrl: string;
  photographerCredit: string;
  /** Which Planespotters endpoint produced this photo (for debugging). */
  photoSource?: "registration" | "hex";
};

export type AircraftProfileMetadata = {
  icao24: string;
  registration: string | null;
  manufacturer: string | null;
  aircraftTypeCode: string | null;
  aircraftTypeName: string | null;
  operatorOrOwner: string | null;
};

export type AircraftProfile = {
  metadata: AircraftProfileMetadata | null;
  photo: AircraftProfilePhoto | null;
};
