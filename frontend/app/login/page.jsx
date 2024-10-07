"use client";
import { useState } from "react";
import Link from "next/link";

import { useAuth } from "@/utils/auth";
import { Footer, Header } from "../page";

export default function Login() {
  const auth = useAuth();

  const [formState, setFormState] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await auth.login(formState);
    } catch (error) {
      alert(error);
    }
  };

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
                  Sign in to your account
                </h2>
              </div>

              <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form
                  onSubmit={handleSubmit}
                  method="POST"
                  className="space-y-6"
                >
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium leading-6 text-white"
                    >
                      Username
                    </label>
                    <div className="mt-2">
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                        value={formState.username}
                        onChange={(e) =>
                          setFormState((state) => ({
                            ...state,
                            username: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium leading-6 text-white"
                      >
                        Password
                      </label>
                      <div className="text-sm">
                        <Link
                          href="#"
                          className="font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </div>
                    <div className="mt-2">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                        value={formState.password}
                        onChange={(e) =>
                          setFormState((state) => ({
                            ...state,
                            password: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                    >
                      Sign in
                    </button>
                  </div>
                </form>

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
