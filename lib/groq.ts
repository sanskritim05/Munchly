export interface PlateAnalysis {
  dish_name: string;
}

/** Plate naming does not use Groq; users enter dish names when posting. */
export async function analyzePlate(_imageUrl: string): Promise<PlateAnalysis> {
  return { dish_name: "Chef's Special" };
}
