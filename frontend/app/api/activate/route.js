// api/activate/route.js

const { NextResponse } = require("next/server");
const axios = require("axios").default;

export async function POST(request) {
  const { uid, token } = await request.json();

  if (!uid || !token) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_SERVER}/api/auth/users/activation/`,
      { uid, token },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "insomnia/9.3.2",
        },
      }
    );

    console.log("Activation response:");
    console.log(response.data);

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error(error.response);
    return NextResponse.json({ data: error.response.data, type: "error" });
  }
}
