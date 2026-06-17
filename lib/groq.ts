import Groq from "groq-sdk";

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY! });
}

export interface PlateAnalysis {
  dish_name: string;
}

const FALLBACK: PlateAnalysis = {
  dish_name: "Mystery Dish",
};

function cleanAiText(text: string) {
  return text.replace(/[—–]/g, "-").trim();
}

export async function analyzePlate(imageUrl: string): Promise<PlateAnalysis> {
  if (!process.env.GROQ_API_KEY) {
    return { dish_name: "Chef's Special" };
  }

  try {
    const response = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: `Given a food photo URL, return ONLY valid JSON with no markdown:
{ "dish_name": string (2-4 words, plain description of the dish) }`,
        },
        {
          role: "user",
          content: `Describe and judge this food photo: ${imageUrl}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return FALLBACK;

    const parsed = JSON.parse(jsonMatch[0]) as PlateAnalysis;

    return {
      dish_name: cleanAiText(parsed.dish_name || FALLBACK.dish_name),
    };
  } catch {
    return FALLBACK;
  }
}
