"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";

const PENDING = "Pending Manager Approval";

const STATUS_LABEL = {
  [PENDING]: "Awaiting Approval",
  Approved: "Approved",
  Rejected: "Rejected",
  Paid: "Paid",
};

const STATUS_STYLE = {
  [PENDING]: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Approved: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
  Paid: "bg-green-500/20 text-green-400 border border-green-500/30",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: PENDING, label: "Awaiting Approval" },
  { key: "Approved", label: "Approved" },
  { key: "Paid", label: "Paid" },
  { key: "Rejected", label: "Rejected" },
];

export default function InvoicesPage() {
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: "",
    clientName: "",
    amount: "",
    documentUrl: "",
  });

  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    const active = getCurrentUser();
    if (active) {
      setUser({
        name: active.name || "User",
        email: (active.email || "").toLowerCase(),
        role: active.role || "Normal User",
      });
    }
  }, []);

  const fetchInvoices = async () => {
    if (!user) return;
    try {
      // Admins see everything. Normal users only see invoices they submitted.
      const url = isAdmin
        ? "/api/invoices"
        : `/api/invoices?submittedBy=${encodeURIComponent(user.email)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setInvoices(data.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchInvoices();
    const interval = setInterval(fetchInvoices, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Convert uploaded PDF or image file to Base64 string for storage
  const handleFileUpload = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      if (isEditing) {
        setEditingInvoice((prev) => ({ ...prev, documentUrl: base64String }));
      } else {
        setNewInvoice((prev) => ({ ...prev, documentUrl: base64String }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newInvoice,
          submittedByName: user.name,
          submittedByEmail: user.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewInvoice({ invoiceNumber: "", clientName: "", amount: "", documentUrl: "" });
        setIsAddModalOpen(false);
        fetchInvoices();
      } else {
        alert(data.error || "Failed to add invoice");
      }
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingInvoice._id,
          invoiceNumber: editingInvoice.invoiceNumber,
          clientName: editingInvoice.clientName,
          amount: editingInvoice.amount,
          documentUrl: editingInvoice.documentUrl,
          actorEmail: user.email,
          actorRole: user.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingInvoice(null);
        fetchInvoices();
      } else {
        alert(data.error || "Failed to update invoice");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  // Admin only: Approve / Reject / Mark as Paid
  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          actorName: user.name,
          actorRole: user.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchInvoices();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Status error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const params = new URLSearchParams({
        id,
        actorEmail: user.email,
        actorRole: user.role,
      });
      const res = await fetch(`/api/invoices?${params.toString()}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchInvoices();
      } else {
        alert(data.error || "Failed to delete invoice");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const pendingCount = invoices.filter((i) => i.status === PENDING).length;
  const visibleInvoices = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

  // What can the current user do to a given invoice?
  const canEdit = (inv) =>
    isAdmin ||
    (inv.uploadedByEmail === user?.email && (inv.status === PENDING || inv.status === "Rejected"));
  const canDelete = (inv) =>
    isAdmin || (inv.uploadedByEmail === user?.email && inv.status === PENDING);

  return (
    <div className="p-8 max-w-6xl mx-auto text-white space-y-6">
      {/* HEADER WITH ADD BUTTON */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">Invoices & Approvals</h1>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin
              ? "Review submitted invoices and approve or reject them."
              : "New invoices are sent to an admin for approval."}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl text-sm text-white transition shadow-lg"
        >
          + Add Invoice
        </button>
      </div>

      {/* ADMIN: AWAITING APPROVAL BANNER */}
      {isAdmin && pendingCount > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-4">
          <p className="text-sm text-amber-300">
            <span className="font-bold">{pendingCount}</span> invoice{pendingCount === 1 ? "" : "s"} awaiting your approval
          </p>
          <button
            onClick={() => setFilter(PENDING)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold rounded-lg text-white transition"
          >
            Show them
          </button>
        </div>
      )}

      {/* STATUS FILTER TABS */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              filter === f.key
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Invoice #</th>
              <th className="p-4">Client</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Submitted By</th>
              <th className="p-4">Status</th>
              <th className="p-4">Document</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {visibleInvoices.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-4 text-center text-slate-500">
                  {invoices.length === 0
                    ? 'No invoices found. Click "+ Add Invoice" to create one.'
                    : "No invoices with this status."}
                </td>
              </tr>
            ) : (
              visibleInvoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-800/50">
                  <td className="p-4 text-xs text-slate-400">{inv.invoiceNumber}</td>
                  <td className="p-4 font-semibold text-white">{inv.clientName}</td>
                  <td className="p-4">R{Number(inv.amount).toLocaleString()}</td>
                  <td className="p-4 text-xs text-slate-400">{inv.uploadedBy}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                        STATUS_STYLE[inv.status] || "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {STATUS_LABEL[inv.status] || inv.status}
                    </span>
                    {inv.approvedBy && (inv.status === "Approved" || inv.status === "Rejected") && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        {inv.status === "Approved" ? "Approved" : "Rejected"} by {inv.approvedBy}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-xs text-slate-400">
                    {inv.documentUrl ? (
                      <a
                        href={inv.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 underline font-semibold"
                      >
                        View Document
                      </a>
                    ) : (
                      "None"
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-wrap gap-2 justify-end">
                      {isAdmin && inv.status === PENDING && (
                        <>
                          <button
                            onClick={() => handleStatusChange(inv._id, "Approved")}
                            className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(inv._id, "Rejected")}
                            className="px-3 py-1 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 text-xs font-semibold rounded-lg border border-orange-500/30 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {isAdmin && inv.status === "Approved" && (
                        <button
                          onClick={() => handleStatusChange(inv._id, "Paid")}
                          className="px-3 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs font-semibold rounded-lg border border-green-500/30 transition"
                        >
                          Mark Paid
                        </button>
                      )}
                      {canEdit(inv) && (
                        <button
                          onClick={() => setEditingInvoice(inv)}
                          className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30 transition"
                        >
                          {!isAdmin && inv.status === "Rejected" ? "Fix & Resubmit" : "Edit"}
                        </button>
                      )}
                      {canDelete(inv) && (
                        <button
                          onClick={() => handleDelete(inv._id)}
                          className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD INVOICE POPUP MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Submit New Invoice</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Client / Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={newInvoice.clientName}
                  onChange={(e) => setNewInvoice({ ...newInvoice, clientName: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Invoice Number (optional, auto-generated if blank)</label>
                <input
                  type="text"
                  placeholder="e.g. INV-0042"
                  value={newInvoice.invoiceNumber}
                  onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount (R)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 5000"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Attach Invoice PDF / Scan</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleFileUpload(e, false)}
                  className="w-full text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-blue-400 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                This invoice will be marked as <span className="font-bold">Awaiting Approval</span> until an admin signs it off.
              </p>
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-xs rounded-lg text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-lg text-white transition"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INVOICE POPUP MODAL */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Edit Invoice</h3>
              <button
                type="button"
                onClick={() => setEditingInvoice(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Client / Vendor Name</label>
                <input
                  type="text"
                  value={editingInvoice.clientName}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, clientName: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={editingInvoice.invoiceNumber || ""}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, invoiceNumber: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount (R)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingInvoice.amount}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, amount: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">PDF / Scan Document</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="w-full text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-blue-400 hover:file:bg-slate-700 cursor-pointer"
                  />
                  {editingInvoice.documentUrl && (
                    <div className="flex items-center justify-between bg-slate-800 p-2 rounded text-xs">
                      <a
                        href={editingInvoice.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 underline"
                      >
                        View Current Document
                      </a>
                      <button
                        type="button"
                        onClick={() => setEditingInvoice({ ...editingInvoice, documentUrl: "" })}
                        className="px-2 py-0.5 bg-red-600/30 text-red-400 rounded text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {editingInvoice.status === "Rejected" && (
                <p className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                  Saving will send this invoice back to the admin for approval.
                </p>
              )}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 bg-slate-800 text-xs rounded-lg text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-lg text-white transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}