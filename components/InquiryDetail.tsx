import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateInquiry, getTemplates } from "../lib/api";
import type { Inquiry, Template } from "../lib/database.types";
import {
  X,
  Loader2,
  MessageSquare,
  Phone,
  Users,
  Send,
  FileText,
} from "lucide-react";
import { SiInstagram as Instagram, SiFacebook as Facebook } from "react-icons/si";

const channelIconMap: Record<string, React.ReactNode> = {
  WhatsApp: <MessageSquare className="w-4 h-4" />,
  Instagram: <Instagram className="w-4 h-4" />,
  Facebook: <Facebook className="w-4 h-4" />,
  "Phone Call": <Phone className="w-4 h-4" />,
  "Walk-in": <Users className="w-4 h-4" />,
  Other: <MessageSquare className="w-4 h-4" />,
};

type Props = {
  inquiry: Inquiry;
  open: boolean;
  onClose: () => void;
  onUpdated: (inquiry: Inquiry) => void;
  onDeleted: (id: string) => void;
};

export default function InquiryDetail({ inquiry, open, onClose, onUpdated, onDeleted }: Props) {
  const { businessId } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (businessId) {
      getTemplates(businessId).then(setTemplates).catch(() => {});
    }
  }, [businessId]);

  // ─── Status transitions ───
  const handleStatusChange = async (newStatus: string) => {
    try {
      const updated = await updateInquiry(inquiry.id, {
        status: newStatus as Inquiry["status"],
        status_changed_at: new Date().toISOString(),
      });
      onUpdated(updated);
    } catch {
      console.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this inquiry? This cannot be undone.")) return;
    try {
      const { deleteInquiry } = await import("../lib/api");
      await deleteInquiry(inquiry.id);
      onDeleted(inquiry.id);
    } catch {
      console.error("Failed to delete");
    }
  };

  const handleQuickReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      // Log reply as a note
      const note = `[Reply]\n${replyText}`;

      // Also create a follow-up note
      const updated = await updateInquiry(inquiry.id, {
        status: inquiry.status === "New" ? "Contacted" : inquiry.status,
        status_changed_at:
          inquiry.status === "New" ? new Date().toISOString() : undefined,
        notes: inquiry.notes
          ? `${inquiry.notes}\n\n---\n${new Date().toLocaleString()}\n${note}`
          : `${new Date().toLocaleString()}\n${note}`,
      });
      onUpdated(updated);
      setReplyText("");
    } catch {
      console.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (tpl: Template) => {
    setReplyText(tpl.message_text);
    setShowTemplates(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (val: number | null) => {
    if (val == null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (!open) return null;

  const statusOptions: Inquiry["status"][] = [
    "New",
    "Contacted",
    "Quoted",
    "Won",
    "Lost",
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl border-l border-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-lg bg-muted">
              {channelIconMap[inquiry.channel] || (
                <MessageSquare className="w-5 h-5" />
              )}
            </span>
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-semibold text-foreground truncate">
                {inquiry.customer_name}
              </h2>
              <p className="text-xs text-secondary">{inquiry.channel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    inquiry.status === s
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-background text-secondary border-border hover:border-primary/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {inquiry.lost_reason && inquiry.status === "Lost" && (
              <p className="mt-2 text-xs text-destructive">
                Lost reason: {inquiry.lost_reason}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
              Message
            </label>
            <div className="p-3 bg-muted rounded-lg border border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {inquiry.message}
              </p>
            </div>
          </div>

          {inquiry.customer_phone && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Phone className="w-4 h-4 text-secondary" />
              <a href={`tel:${inquiry.customer_phone}`} className="text-accent hover:underline">
                {inquiry.customer_phone}
              </a>
              <a href={`https://wa.me/${inquiry.customer_phone.replace(/[\s\-\(\)]/g, '')}?text=${encodeURIComponent(inquiry.message)}`}
                target="_blank" rel="noopener noreferrer"
                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-all duration-150 cursor-pointer"
                aria-label="Open in WhatsApp">
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border border-border">
            <div>
              <p className="text-xs text-secondary uppercase tracking-wider mb-1">
                Estimated Value
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(inquiry.estimated_value)}
              </p>
            </div>
            <div>
              <p className="text-xs text-secondary uppercase tracking-wider mb-1">
                Follow-up
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(inquiry.follow_up_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-secondary uppercase tracking-wider mb-1">
                Created
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(inquiry.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-secondary uppercase tracking-wider mb-1">
                Updated
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(inquiry.updated_at)}
              </p>
            </div>
          </div>

          {/* Notes */}
          {inquiry.notes && (
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                Notes
              </label>
              <div className="p-3 bg-background rounded-lg border border-border">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {inquiry.notes}
                </p>
              </div>
            </div>
          )}

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="text-xs text-destructive hover:text-red-800 font-medium cursor-pointer transition-colors"
          >
            Delete this inquiry
          </button>
        </div>

        {/* Quick Reply Footer */}
        <div className="border-t border-border p-4 shrink-0 bg-white">
          {templates.length > 0 && (
            <div className="mb-2">
              <button
                onClick={() => setShowTemplates((prev) => !prev)}
                className="text-xs text-accent hover:text-accent/80 font-medium cursor-pointer transition-colors inline-flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                {showTemplates ? "Hide quick replies" : "Use quick reply template"}
              </button>
              {showTemplates && (
                <div className="mt-1 p-2 bg-muted rounded-lg border border-border space-y-1 max-h-24 overflow-y-auto">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      className="block w-full text-left px-3 py-1.5 rounded-md text-xs text-foreground hover:bg-white transition-colors cursor-pointer"
                    >
                      <span className="font-medium">{tpl.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type a quick reply..."
              className="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickReply();
                }
              }}
            />
            <button
              onClick={handleQuickReply}
              disabled={sending || !replyText.trim()}
              className="px-4 py-2.5 bg-accent text-white rounded-lg hover:opacity-90 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 text-sm font-medium"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
