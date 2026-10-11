"use client";

import { useState, useEffect } from "react";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", company: "" });

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (data.success) setClients(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      const data = await res.json();
      if (data.success) {
        setNewClient({ name: "", email: "", phone: "", company: "" });
        fetchClients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      const res = await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/clients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingClient._id,
          name: editingClient.name,
          email: editingClient.email,
          phone: editingClient.phone,
          company: editingClient.company,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingClient(null);
        fetchClients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-white space-y-6">
      <h1 className="text-2xl font-bold text-blue-400">Clients</h1>

      {/* Add Client Form */}
      <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex gap-3 items-center">
        <input
          type="text"
          placeholder="Client Name"
          value={newClient.name}
          onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white flex-1"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={newClient.email}
          onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white flex-1"
          required
        />
        <input
          type="text"
          placeholder="Company"
          value={newClient.company}
          onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white flex-1"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-bold rounded text-sm text-white">
          Add Client
        </button>
      </form>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Company</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {clients.map((c) => (
              <tr key={c._id} className="hover:bg-slate-800/50">
                <td className="p-4 font-semibold text-white">{c.name}</td>
                <td className="p-4">{c.email}</td>
                <td className="p-4">{c.company || "N/A"}</td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => setEditingClient(c)}
                    className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Edit Client</h3>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Company</label>
                <input
                  type="text"
                  value={editingClient.company || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, company: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 bg-slate-800 text-xs rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-xs font-bold rounded-lg text-white">
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