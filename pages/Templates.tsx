import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../lib/api";
import type { Template } from "../lib/database.types";
import {
  FileText, Plus, Pencil, Trash2, Loader2, MessageSquare,
  X, Check,
} from "lucide-react";

export default function Templates() {
  const { businessId } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    getTemplates(businessId)
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessId]);

  const openAdd = () => {
    setEditing(null);
    setFormTitle("");
    setFormMessage("");
    setModalOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setFormTitle(t.title);
    setFormMessage(t.message_text);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!businessId || !formTitle.trim() || !formMessage.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateTemplate(editing.id, {
          title: formTitle.trim(),
          message_text: formMessage.trim(),
        });
        setTemplates((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
      } else {
        const created = await createTemplate({
          business_id: businessId,
          title: formTitle.trim(),
          message_text: formMessage.trim(),
        });
        setTemplates((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch {
      console.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this template? This cannot be undone.")) return;
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      console.error("Failed to delete template");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Quick Reply Templates
          </h1>
          <p className="text-secondary mt-1 text-sm">
            Create and manage reusable message templates
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg hover:opacity-90 transition-all duration-150 cursor-pointer text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Template list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-secondary" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-secondary" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
            No templates yet
          </h2>
          <p className="text-secondary text-sm max-w-sm mb-6">
            Create reusable message templates to respond faster to common
            customer inquiries.
          </p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg hover:opacity-90 transition-all duration-150 cursor-pointer text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-all duration-150 group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-heading text-base font-semibold text-foreground truncate">
                  {t.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 text-secondary hover:text-accent hover:bg-accent/10 rounded-md transition-all duration-150 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Edit ${t.title}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 text-secondary hover:text-destructive hover:bg-red-50 rounded-md transition-all duration-150 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Delete ${t.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-secondary line-clamp-3 mb-3 leading-relaxed">
                {t.message_text}
              </p>
              <div className="flex items-center gap-2 text-xs text-secondary/60">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Created {formatDate(t.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-border w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {editing ? "Edit Template" : "New Template"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-secondary hover:text-foreground rounded-md transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Thank you for your inquiry"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder="Type your template message here..."
                    rows={5}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
                  />
                  <p className="text-xs text-secondary/60 mt-1">
                    {formMessage.length} character{formMessage.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-foreground bg-white border border-border rounded-lg hover:bg-muted transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formTitle.trim() || !formMessage.trim() || saving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
