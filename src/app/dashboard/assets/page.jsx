"use client";

import { useState, useEffect } from "react";

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [editingAsset, setEditingAsset] = useState(null);
  const [newAsset, setNewAsset] = useState({ name: "", category: "Hardware", serialNumber: "", status: "Available" });

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/assets");
      const data = await res.json();
      if (data.success) setAssets(data.data);
    } catch (err) {
      console.error("Failed to fetch assets:", err);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAsset),
      });
      const data = await res.json();
      if (data.success) {
        setNewAsset({ name: "", category: "Hardware", serialNumber: "", status: "Available" });
        fetchAssets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    try {
      const res = await fetch(`/api/assets?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAsset._id,
          name: editingAsset.name,
          category: editingAsset.category,
          serialNumber: editingAsset.serialNumber,
          status: editingAsset.status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingAsset(null);
        fetchAssets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-white space-y-6">
      <h1 className="text-2xl font-bold text-blue-400">Assets</h1>

      {/* CREATE FORM */}
      <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 p-4 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
        <input
          type="text"
          placeholder="Asset Name"
          value={newAsset.name}
          onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
          required
        />
        <input
          type="text"
          placeholder="Serial Number"
          value={newAsset.serialNumber}
          onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
        />
        <select
          value={newAsset.category}
          onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
        >
          <option value="Hardware">Hardware</option>
          <option value="Software License">Software License</option>
          <option value="Office Equipment">Office Equipment</option>
        </select>
        <select
          value={newAsset.status}
          onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
        >
          <option value="Available">Available</option>
          <option value="Assigned">Assigned</option>
          <option value="Maintenance">Maintenance</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-bold rounded text-sm text-white">
          Add Asset
        </button>
      </form>

      {/* TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Serial #</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {assets.map((a) => (
              <tr key={a._id} className="hover:bg-slate-800/50">
                <td className="p-4 font-semibold text-white">{a.name}</td>
                <td className="p-4">{a.category}</td>
                <td className="p-4 font-mono text-xs">{a.serialNumber || "N/A"}</td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-slate-800 text-slate-300">
                    {a.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => setEditingAsset(a)}
                    className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a._id)}
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

      {/* EDIT MODAL */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Edit Asset</h3>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={editingAsset.serialNumber || ""}
                  onChange={(e) => setEditingAsset({ ...editingAsset, serialNumber: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Status</label>
                <select
                  value={editingAsset.status}
                  onChange={(e) => setEditingAsset({ ...editingAsset, status: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                >
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
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