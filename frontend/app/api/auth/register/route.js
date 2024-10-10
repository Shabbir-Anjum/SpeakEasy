import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json();
  const { first_name, last_name, username, email, password, re_password } = body;

  if (
    !first_name ||
    !last_name ||
    !username ||
    !email ||
    !password ||
    !re_password
  ) {
    return NextResponse.json(
      { error: "Missing required values" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER}/api/auth/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "insomnia/9.3.2",
      },
      body: JSON.stringify({
        "username": username,
        "password": password,
        "re_password": re_password,
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
      }),
    });

    const responseData = await response.json();

    console.log("Register response:");
    console.log(responseData);

    if (!response.ok) {
      throw new Error(responseData.error || "Registration failed");
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}