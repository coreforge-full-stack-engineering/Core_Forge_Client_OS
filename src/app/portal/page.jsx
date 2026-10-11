"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";

export default function ExecutivePortalPage() {
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUserState] = useState(null);

  useEffect(() => {
    setCurrentUserState(getCurrentUser());
  }, []);

  useEffect(() => {
    fetchAllMetrics();
  }, []);

  const fetchAllMetrics = async () => {
    try {
      // Fetch data concurrently from all ERP modules
      const [invRes, docRes, astRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/documents"),
        fetch("/api/assets"),
      ]);

      const [invData, docData, astData] = await Promise.all([
        invRes.json(),
        docRes.json(),
        astRes.json(),
      ]);

      if (invData.success) setInvoices(invData.data);
      if (docData.success) setDocuments(docData.data);
      if (astData.success) setAssets(astData.data);
    } catch (error) {
      console.error("Failed to load Executive Metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Executive Metric Calculations
  const pendingInvoices = invoices.filter((inv) => inv.status === "Pending Manager Approval");
  const approvedInvoices = invoices.filter((inv) => inv.status === "Approved" || inv.status === "Paid");
  const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalApprovedAmount = approvedInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Asset Status Calculation
  const checkedOutCount = assets.filter((a) => a.status === "Checked Out").length;

  // Completion Percentage calculation based on financial approval volume
  const totalFinancialVolume = totalPendingAmount + totalApprovedAmount;
  const overallApprovalRate = totalFinancialVolume > 0 
    ? Math.round((totalApprovedAmount / totalFinancialVolume) * 100) 
    : 100;

  // Manager One-Click Sign-Off
  const handleApproveInvoice = async (invoiceId) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: invoiceId,
          status: "Approved",
          actorName: currentUser?.name,
          actorRole: currentUser?.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInvoices(invoices.map((inv) => (inv._id === invoiceId ? data.data : inv)));
      } else {
        alert(data.error || "Approval failed");
      }
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 text-white">
      {/* Executive Header */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Command Center</h1>
          <p className="text-slate-400 mt-1">Central statistics, approval pipelines, and operational health overview.</p>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">System Status</span>
          <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium inline-block mt-1">
            ● ERP Live & Synced
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500">Aggregating live data streams from MongoDB...</div>
      ) : (
        <>
          {/* 1. Overall Completion Chart Banner */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-300">Financial Sign-Off & Execution Progress</span>
              <span className="text-emerald-400 text-lg font-bold">{overallApprovalRate}% Approved</span>
            </div>
            
            {/* Visual Progress Bar */}
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${overallApprovalRate}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-400 pt-1">
              <span>R{totalApprovedAmount.toLocaleString()} Processed</span>
              <span>R{totalPendingAmount.toLocaleString()} Pending Queue</span>
            </div>
          </div>

          {/* 2. Urgent Approval Action Banner */}
          {pendingInvoices.length > 0 ? (
            <div className="p-6 bg-slate-900 border border-amber-500/30 rounded-xl flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  ACTION REQUIRED ({pendingInvoices.length} PENDING MANAGER SIGN-OFF)
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Invoice {pendingInvoices[0].invoiceNumber} requires sign-off
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  Amount: <span className="text-emerald-400 font-semibold">R{pendingInvoices[0].amount.toLocaleString()}</span> • Vendor: {pendingInvoices[0].clientName}
                </p>
              </div>

              {currentUser?.role === "Admin" && (
              <button
                onClick={() => handleApproveInvoice(pendingInvoices[0]._id)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg text-sm text-white transition whitespace-nowrap shadow-lg shadow-emerald-900/20"
              >
                Approve Invoice
              </button>
              )}
            </div>
          ) : (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm text-center">
              ✓ All financial records are fully approved by management.
            </div>
          )}

          {/* 3. ERP Central Stats Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Invoice Approvals */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Pending Invoices</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-amber-400">{pendingInvoices.length}</span>
                <span className="text-xs text-slate-500">R{totalPendingAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Document Repository */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Logged Documents</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-blue-400">{documents.length}</span>
                <span className="text-xs text-slate-500">Files active</span>
              </div>
            </div>

            {/* Equipment Assets */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Assets Checked Out</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-400">{checkedOutCount}</span>
                <span className="text-xs text-slate-500">of {assets.length} total</span>
              </div>
            </div>

            {/* Total Valuation */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Catalog Valuation</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-purple-400">
                  R{assets.reduce((sum, a) => sum + (a.purchaseValue || 0), 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">ZAR</span>
              </div>
            </div>
          </div>

          {/* 4. Combined Activity Logs Stream */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Document Logs */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <h3 className="text-base font-semibold text-white">Recent Document Uploads</h3>
              <div className="space-y-3">
                {documents.slice(0, 3).length === 0 ? (
                  <p className="text-xs text-slate-500">No documents uploaded yet.</p>
                ) : (
                  documents.slice(0, 3).map((doc) => (
                    <div key={doc._id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <p className="font-medium text-slate-200">{doc.title}</p>
                        <p className="text-slate-500 mt-0.5">{doc.clientName}</p>
                      </div>
                      <span className="px-2 py-1 bg-slate-800 text-blue-400 rounded font-medium">
                        {doc.category}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Financial Approvals */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <h3 className="text-base font-semibold text-white">Financial Approval Log</h3>
              <div className="space-y-3">
                {invoices.slice(0, 3).length === 0 ? (
                  <p className="text-xs text-slate-500">No invoices logged yet.</p>
                ) : (
                  invoices.slice(0, 3).map((inv) => (
                    <div key={inv._id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <p className="font-medium text-slate-200">{inv.invoiceNumber}</p>
                        <p className="text-emerald-400 font-semibold mt-0.5">R{inv.amount.toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded font-medium ${
                        inv.status === "Approved" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {inv.status === "Pending Manager Approval" ? "Awaiting Approval" : inv.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}