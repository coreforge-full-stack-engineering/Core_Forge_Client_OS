"use client";

import Link from "next/link";

export default function BusinessOverviewPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 text-white">
      {/* Overview Header */}
      <div>
        <h1 className="text-2xl font-bold">Business Overview</h1>
        <p className="text-slate-400">Welcome to Core Forge ClientOS. Here is your operational control summary.</p>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          href="/portal" 
          className="p-6 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl transition space-y-2 block"
        >
          <span className="text-2xl">📊</span>
          <h3 className="font-bold text-lg text-white">Executive Command Center</h3>
          <p className="text-xs text-slate-400">View real-time financial stats, charts, and pending manager approval banners.</p>
        </Link>

        <Link 
          href="/dashboard/invoices" 
          className="p-6 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition space-y-2 block"
        >
          <span className="text-2xl">💳</span>
          <h3 className="font-bold text-lg text-white">Invoices & Approvals</h3>
          <p className="text-xs text-slate-400">Submit new invoices, attach scanned PDF copies, and process approvals.</p>
        </Link>

        <Link 
          href="/dashboard/assets" 
          className="p-6 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition space-y-2 block"
        >
          <span className="text-2xl">🏷️</span>
          <h3 className="font-bold text-lg text-white">Asset Management</h3>
          <p className="text-xs text-slate-400">Track equipment catalog values, assign custodians, and toggle check-out status.</p>
        </Link>
      </div>
    </div>
  );
}