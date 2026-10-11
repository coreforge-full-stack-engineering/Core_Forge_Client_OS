"use client";

import { useState, useEffect } from "react";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "Normal User" });
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.success) {
        setNewUser({ name: "", email: "", password: "", role: "Normal User" });
        setIsAddOpen(false);
        fetchUsers();
      } else {
        alert(data.error || "Failed to add user");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add user");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser._id,
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          password: editingUser.password || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-400">User Management</h1>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl text-sm text-white transition shadow-lg"
        >
          + Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-slate-800/50">
                <td className="p-4 font-semibold text-white">{u.name}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    u.role === "Admin" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-slate-800 text-slate-400"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => setEditingUser(u)}
                    className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u._id)}
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

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="e.g. jane@coreforge.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Temporary password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                >
                  <option value="Normal User">Normal User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-xs rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-lg text-white"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Edit User Credentials</h3>
            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                >
                  <option value="Normal User">Normal User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editingUser.password || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-800 text-xs rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-lg text-white"
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