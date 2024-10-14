import { NextResponse } from "next/server";
import { useDispatch} from 'react-redux';
import { setToken} from '@/store/ChatSlice';
export async function POST(request) {
  const body = await request.json();
  const dispatch = useDispatch();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Missing username or password" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER}/api/auth/jwt/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "insomnia/9.3.2",
      },
      body: JSON.stringify({
        "username": username,
        "password": password,
      }),
    });

    const responseData = await response.json();

    console.log("Login response:");
    console.log(responseData);
    dispatch(setToken(responseData));

    if (!response.ok) {
      throw new Error(responseData.error || "Login failed");
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}