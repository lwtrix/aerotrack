import { NextResponse } from "next/server";
import { getLiveAircraftStates } from "@/services/opensky";

export async function GET() {
  try {
    const aircraft = await getLiveAircraftStates();

    return NextResponse.json({
      success: true,
      count: aircraft.length,
      updatedAt: new Date().toISOString(),
      data: aircraft,
    });
  } catch (error) {
    console.error("Failed to fetch live aircraft states:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch live aircraft states.",
      },
      {
        status: 500,
      }
    );
  }
}