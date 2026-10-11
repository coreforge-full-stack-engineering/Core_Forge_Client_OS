"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCurrentUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();

      // Fetch users from MongoDB
      const res = await fetch("/api/users");
      const data = await res.json();

      let matchedUser = null;

      if (data.success && data.data) {
        matchedUser = data.data.find(
          (u) => u.email?.trim().toLowerCase() === cleanEmail
        );
      }

      // Hardcoded fallback for Ruan Admin
      if (!matchedUser && cleanEmail === "ruan@coreforge.com") {
        matchedUser = { name: "Ruan", email: "ruan@coreforge.com", role: "Admin" };
      }

      // Hardcoded fallback for Arno
      if (!matchedUser && (cleanEmail === "arno@coreforge.com" || cleanEmail.includes("arno"))) {
        matchedUser = { name: "Arno Mostert", email: "arno@coreforge.com", role: "Normal User" };
      }

      if (matchedUser) {
        setCurrentUser({
          name: matchedUser.name,
          email: matchedUser.email.trim().toLowerCase(),
          role: matchedUser.role || "Normal User",
        });
        router.push("/welcome");
      } else {
        setError("Invalid credentials.");
      }
    } catch (err) {
      setError("Login failed.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="w-full max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-4 shadow-2xl">
        <h1 className="text-xl font-bold text-blue-400 text-center">Core Forge ClientOS</h1>
        <p className="text-xs text-slate-400 text-center">Sign in to your team account</p>
        
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
          <input
            type="email"
            placeholder="e.g. arno@coreforge.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition shadow-lg shadow-blue-600/20">
          Sign In
        </button>
      </form>
    </main>
  );
}