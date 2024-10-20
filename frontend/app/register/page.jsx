"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/utils/auth";
import { Footer, Header } from "../page";

export default function Register() {
  const auth = useAuth();

  const [formState, setFormState] = useState({
    email: "",
    username: "",
    password: "",
    re_password: "",
    first_name: "",
    last_name: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await auth.register(formState);
    } catch (error) {
      alert(error);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else if (field === 're_password') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <>
      <div
        className="min-h-screen bg-cover bg-center bg-fixed relative text-white flex items-center"
        style={{ backgroundImage: 'url("/1.jpg")' }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <Header />

        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col">
              <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
                  Register your account
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
                      htmlFor="first_name"
                      className="block text-sm font-medium leading-6 text-white"
                    >
                      First Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        required
                        className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                        value={formState.first_name}
                        onChange={(e) =>
                          setFormState((state) => ({
                            ...state,
                            first_name: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="last_name"
                      className="block text-sm font-medium leading-6 text-white"
                    >
                      Last Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        required
                        className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                        value={formState.last_name}
                        onChange={(e) =>
                          setFormState((state) => ({
                            ...state,
                            last_name: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

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
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium leading-6 text-white"
                    >
                      Email address
                    </label>
                    <div className="mt-2">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                        value={formState.email}
                        onChange={(e) =>
                          setFormState((state) => ({
                            ...state,
                            email: e.target.value,
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
                    </div>
                    <div className="mt-2 relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 pr-10"
                        value={formState.password}
                        onChange={(e) =>
                          setFormState((state) => ({
                            ...state,
                            password: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => togglePasswordVisibility('password')}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="re_password"
                        className="block text-sm font-medium leading-6 text-white"
                      >
                        Confirm Password
                      </label>
                    </div>
                    <div className="mt-2 relative">
                      <input
                        id="re_password"
                        name="re_password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 pr-10"
                        value={formState.re_password}
                        onChange={(e) =>
                          setFormState((state) => ({
                            ...state,
                            re_password: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => togglePasswordVisibility('re_password')}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                    >
                      Register
                    </button>
                  </div>
                </form>

                <p className="mt-10 text-center text-sm text-gray-400">
                  Already registered?{" "}
                  <Link
                    href="/login"
                    className="font-semibold leading-6 text-indigo-400 hover:text-indigo-300"
                  >
                    Login here
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
