"use client";

import { useState, useEffect } from "react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({ title: "", description: "", status: "In Progress", client: "" });

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success) setProjects(data.data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });
      const data = await res.json();
      if (data.success) {
        setNewProject({ title: "", description: "", status: "In Progress", client: "" });
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProject._id,
          title: editingProject.title,
          description: editingProject.description,
          status: editingProject.status,
          client: editingProject.client,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingProject(null);
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-white space-y-6">
      <h1 className="text-2xl font-bold text-blue-400">Projects</h1>

      {/* CREATE FORM */}
      <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 p-4 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
        <input
          type="text"
          placeholder="Project Title"
          value={newProject.title}
          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
          required
        />
        <input
          type="text"
          placeholder="Client Name"
          value={newProject.client}
          onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
        />
        <input
          type="text"
          placeholder="Description"
          value={newProject.description}
          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
        />
        <select
          value={newProject.status}
          onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
        >
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-bold rounded text-sm text-white">
          Add Project
        </button>
      </form>

      {/* TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Client</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {projects.map((p) => (
              <tr key={p._id} className="hover:bg-slate-800/50">
                <td className="p-4 font-semibold text-white">{p.title}</td>
                <td className="p-4">{p.client || "N/A"}</td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => setEditingProject(p)}
                    className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
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
      {editingProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Edit Project</h3>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Client</label>
                <input
                  type="text"
                  value={editingProject.client || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Status</label>
                <select
                  value={editingProject.status}
                  onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value })}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
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