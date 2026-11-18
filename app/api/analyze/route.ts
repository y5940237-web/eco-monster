export async function POST(req: Request) {
  const { kind } = await req.json();

  if (kind === "litter") {
    return Response.json({ type: "drink container", count: 3 });
  }
  if (kind === "refund") {
    return Response.json({ amount: 0.5 });
  }
  return Response.json({ error: "Unknown kind" }, { status: 400 });
}