"use client";

import { useState, useEffect } from "react";

export default function FinancePage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (error) {
      console.error("Failed to load invoice metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const pendingAmount = invoices
    .filter((inv) => inv.status === "Pending Manager Approval")
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const approvedAmount = invoices
    .filter((inv) => inv.status === "Approved" || inv.status === "Paid")
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 text-white">
      <div>
        <h1 className="text-2xl font-bold">Financial Overview</h1>
        <p className="text-slate-400 text-sm">Revenue metrics, total billing volume, and ledger breakdown.</p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading ledger statistics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Total Volume</span>
            <span className="text-3xl font-bold text-white">R{totalInvoiced.toLocaleString()}</span>
            <p className="text-xs text-slate-500">Across {invoices.length} billing records</p>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Approved / Settled</span>
            <span className="text-3xl font-bold text-emerald-400">R{approvedAmount.toLocaleString()}</span>
            <p className="text-xs text-slate-500">Cleared financial assets</p>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Pending Queue</span>
            <span className="text-3xl font-bold text-amber-400">R{pendingAmount.toLocaleString()}</span>
            <p className="text-xs text-slate-500">Awaiting sign-off</p>
          </div>
        </div>
      )}
    </div>
  );
}