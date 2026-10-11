import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl space-y-6">
        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Core Forge ClientOS
        </h1>

        {/* Tagline */}
        <p className="text-slate-400 text-lg sm:text-xl max-w-xl mx-auto">
          The complete enterprise operating system for internal operations, asset tracking, and financial sign-offs.
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/20"
          >
            Business Dashboard
          </Link>

          <Link
            href="/portal"
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl transition"
          >
            Executive Command Center
          </Link>
        </div>
      </div>
    </main>
  );
}