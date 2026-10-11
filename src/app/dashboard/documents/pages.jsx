"use client";

import { useState, useEffect } from "react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Internal Brief");
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!title) return;

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          clientName: clientName || "General Operations",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setDocuments([data.data, ...documents]);
        setTitle("");
        setCategory("Internal Brief");
        setClientName("");
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to add document:", error);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Document Repository</h1>
          <p className="text-slate-400">Store, organize, and reference internal briefs, contracts, and proposals.</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg text-sm text-white transition"
        >
          + Upload Document Record
        </button>
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading document repository from MongoDB...</div>
      ) : (
        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-500">
              No files in repository. Click "+ Upload Document Record" to register a new document.
            </div>
          ) : (
            documents.map((doc) => (
              <div 
                key={doc._id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-white">{doc.title}</h3>
                    <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-blue-400 rounded border border-slate-700">
                      {doc.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Related Entity: <span className="text-slate-300">{doc.clientName}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                  <a
                    href={doc.fileUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
                  >
                    View File
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-md text-white">
            <h2 className="text-xl font-bold mb-2">Register Document</h2>
            <p className="text-sm text-slate-400 mb-6">Log new file metadata into the central ERP database.</p>

            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Document Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Service Level Agreement 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Document Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option>Internal Brief</option>
                  <option>Proposal</option>
                  <option>Contract</option>
                  <option>Technical Specification</option>
                  <option>Compliance & Audit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Related Client / Entity</label>
                <input 
                  type="text"
                  placeholder="e.g. General Operations"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg text-sm transition"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}