import { GoogleGenerativeAI } from "@google/generative-ai";

const parseJsonFromText = (text) => {
  try {
    const match = text.match(/\{[\s\S]*\}$/);
    return JSON.parse(match ? match[0] : text);
  } catch {
    return null;
  }
};

export async function generateActivities({ city, country, weatherText, tempC, timeOfDay }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(apiKey);
  // Align with clock app version for broader availability
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Return ONLY minified JSON with this exact shape:
  {"items":[{"title":"string","place":"string","description":"string"},{"title":"string","place":"string","description":"string"},{"title":"string","place":"string","description":"string"},{"title":"string","place":"string","description":"string"}]}
  Rules: 1) base on ${city}, ${country}; 2) consider weather "${weatherText}" and ${tempC}°C in the ${timeOfDay}; 3) prefer nearby, safe, public places; 4) descriptions are 2–3 sentences; 5) do not include markdown or extra text.`;

  const result = await model.generateContent(prompt);
  const data = parseJsonFromText(result.response.text());
  if (!data || !Array.isArray(data.items)) throw new Error("Gemini JSON malformed");
  return data.items;
}


