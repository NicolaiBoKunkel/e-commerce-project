"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/UserContext";
import { useNotifications } from "../context/NotificationContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unseenCount = notifications.filter((n) => !n.seen).length;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-gray-800 text-white px-6 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-xl font-bold">E-Commerce</div>
        <div className="space-x-4 flex items-center relative">
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

          {user ? (
            <>
              {/* Notification Bell */}
              <div ref={dropdownRef} className="relative">
                <div
                  className="cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span>🔔</span>
                  {unseenCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-1 rounded-full">
                      {unseenCount}
                    </span>
                  )}
                </div>

                {showDropdown && (
                  <div className="absolute right-0 top-10 bg-white text-black w-72 max-h-96 overflow-auto shadow-lg rounded-md z-50">
                    <div className="p-2 border-b font-semibold">Notifications</div>
                    {notifications.length === 0 ? (
                      <div className="p-2 text-sm text-gray-600">No notifications</div>
                    ) : (
                      notifications.slice(0, 10).map((n, idx) => (
                        <div key={idx} className="p-2 border-b hover:bg-gray-100">
                          <div className="text-sm font-medium">{n.message}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(n.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Link
                href="/profile"
                className={`hover:underline ${pathname === "/profile" ? "text-yellow-300" : ""}`}
              >
                Profile
              </Link>
              <button onClick={handleLogout} className="hover:underline text-red-400">
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
