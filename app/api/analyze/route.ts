import{ GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
const MODEL = "gemini-3.8-flash";

const PROMPTS = {
  litter: `You check photos for a litter-awareness game.
Decide whether the photo shows real litter or garbage outdoors
(e.g. cigarette butts, food wrappers, drink containers, plastic bags).
Reply with this JSON:
{"accepted": true or false,
 "type": "cigarette butt" | "food wrapper" | "drink container" | "other litter" | null,
 "count": number of litter items you can see (0 if none),
 "reason": "one short, friendly sentence"}
Set accepted to false if there is no litter, if it is a photo of a screen,
or if a person is the main subject.`,

  refund: `You check photos for a recycling game.
Decide whether the photo shows the refund screen of a drink-container
return machine, and read the refund amount.
Reply with this JSON:
{"accepted": true or false,
 "amount": refund in dollars as a number (0 if not readable),
 "reason": "one short, friendly sentence"}`,
};


export async function POST(req: Request) {
  const { kind, image } = await req.json();

  // Check what the page sent before calling the AI
  if (kind !== "litter" && kind !== "refund") {
    return Response.json({ error: "Unknown kind" }, { status: 400 });
  }
  if (typeof image !== "string" || image.length === 0) {
    return Response.json({ error: "No photo sent" }, { status: 400 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "GEMINI_API_KEY is missing" }, { status: 500 });
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: image } },
        { text: PROMPTS[kind as "litter" | "refund"] },
      ],
      config: { responseMimeType: "application/json" }, // forces a JSON reply
    });

    return Response.json(JSON.parse(response.text ?? "{}"));
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "AI check failed (maybe the free limit was reached)" },
      { status: 500 }
    );
  }
}