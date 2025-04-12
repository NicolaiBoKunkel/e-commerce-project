"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check for token on mount
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/");
  };

  return (
    <nav className="bg-gray-800 text-white px-6 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-xl font-bold">E-Commerce</div>
        <div className="space-x-4">
          <Link
            href="/"
            className={`hover:underline ${pathname === "/" ? "text-yellow-300" : ""}`}
          >
            Home
          </Link>
          <Link
            href="/products"
            className={`hover:underline ${pathname === "/products" ? "text-yellow-300" : ""}`}
          >
            Products
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                className={`hover:underline ${pathname === "/profile" ? "text-yellow-300" : ""}`}
              >
                Profile
              </Link>
              <button
                onClick={logout}
                className="hover:underline text-red-400"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`hover:underline ${pathname === "/login" ? "text-yellow-300" : ""}`}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={`hover:underline ${pathname === "/register" ? "text-yellow-300" : ""}`}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
