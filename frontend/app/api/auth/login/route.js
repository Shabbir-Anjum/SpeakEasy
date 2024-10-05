const { NextResponse } = require("next/server");

export async function POST(request) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Missing username or password" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { message: "Login successful", auth_token: "123" },
    { status: 200 }
  );
}
