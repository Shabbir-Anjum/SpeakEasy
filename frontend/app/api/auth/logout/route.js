// api/auth/logout/route.js

const { NextResponse } = require("next/server");
const axios = require("axios").default;

export async function POST(request) {
  const body = await request.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json({ error: "Missing auth token" }, { status: 400 });
  }

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_SERVER}/api/auth/logout`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "insomnia/9.3.2",
          Authorization: `JWT ${token}`,
        },
      }
    );

    console.log("Logout response:");
    console.log(response.data);

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error }, { status: 400 });
  }
}
