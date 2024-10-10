"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/utils/auth";
import { Header, Footer } from "@/app/page";
import axios from "axios";

export default function Activate({ params }) {
  const auth = useAuth();
  const { uid, token } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  console.log("params:  ", params);

  useEffect(() => {
    if (uid && token) {
      try {
        axios.post("/api/activate", { uid, token }).then((res) => {
          setData(res.data);
        });
      } catch (error) {
        setError(error);
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  return (
    <>
      <div
        className="min-h-screen bg-cover bg-center bg-fixed relative text-white flex items-center"
        style={{ backgroundImage: 'url("/1.jpg")' }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <Header auth={auth} />

        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col">
              <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
                  Activating your account
                </h2>
              </div>

              <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                {loading && <h2 className="animate-pulse text-center">...</h2>}

                {error && (
                  <p className="text-center text-red-500">
                    Failed to activate your account. Please try again.
                  </p>
                )}

                {data && (
                  <>
                    {data?.type === "error" ? (
                      <p className="text-center text-red-500">
                        Failed to activate your account. Please try again.
                      </p>
                    ) : (
                      <p className="text-center text-white">
                        Account activation successful! Please login
                      </p>
                    )}
                    <p className="text-center text-white">
                      Account activation successful! Please login
                    </p>
                  </>
                )}

                <p className="mt-10 text-center text-sm text-gray-400">
                  Not a member?{" "}
                  <Link
                    href="/register"
                    className="font-semibold leading-6 text-indigo-400 hover:text-indigo-300"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
