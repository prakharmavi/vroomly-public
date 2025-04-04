import { FuelType, TransmissionType } from "@/firebase/db/model/carmodel";

interface VinLookupResult {
  success: boolean;
  data?: {
    make: string;
    model: string;
    year: number;
    fuelType: FuelType;
    transmission: TransmissionType;
    color: string;
    seats: number;
  };
  error?: string;
}

export async function decodeVin(vin: string, year?: number): Promise<VinLookupResult> {
  try {
    const baseUrl = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/";
    const params = new URLSearchParams({
      format: "json"
    });
    if (year) {
      params.append("modelyear", year.toString());
    }

    const response = await fetch(`${baseUrl}${vin}?${params}`);
    const data = await response.json();

    if (!response.ok || !data.Results?.[0]) {
      throw new Error("Failed to decode VIN");
    }

    const result = data.Results[0];
    
    return {
      success: true,
      data: {
        make: result.Make,
        model: result.Model,
        year: parseInt(result.ModelYear) || year || new Date().getFullYear(),
        fuelType: (result.FuelTypePrimary as FuelType) || FuelType.GASOLINE,
        transmission: (result.TransmissionStyle as TransmissionType) || TransmissionType.AUTOMATIC,
        color: "Not specified", // Default values since NHTSA doesn't provide these
        seats: 5 // Default value
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to decode VIN"
    };
  }
}

export type { VinLookupResult };
