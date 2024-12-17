import { NextRequest, NextResponse } from "next/server";

export const POST = async function POST(req: NextRequest) {
  const { endpoint, nodeId, values } = await req.json();

  const res = await fetch(endpoint + "/update_inputs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nodeId, values }),
  });


  return NextResponse.json(await res.text(), { status: res.status });
};
