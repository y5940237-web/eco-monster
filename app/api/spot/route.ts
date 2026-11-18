import { NextResponse } from "next/server";

// Prototype: pretend the AI looked at the photo.
// Later: send the image to a vision model and return real results.
export async function POST(request: Request) {
  const { kind } = await request.json();

  if (kind === "litter") {
    const types = ["Plastic bottle", "Can", "Paper", "Wrapper"];
    const count = 1 + Math.floor(Math.random() * 5);
    return NextResponse.json({ type: types[Math.floor(Math.random() * types.length)], count });
  }
  if (kind === "refund") {
    const amount = [0.1, 0.2, 0.3, 0.5][Math.floor(Math.random() * 4)];
    return NextResponse.json({ amount });
  }
  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}