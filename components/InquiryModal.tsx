import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createInquiry, updateInquiry, getTemplates } from "../lib/api";
import type {
  Inquiry,
  InquiryChannel,
  InquiryStatus,
  Template,
} from "../lib/database.types";
import {
  X,
  Loader2,
  MessageSquare,
  Phone,
  Users,
} from "lucide-react";
import { SiInstagram as Instagram, SiFacebook as Facebook } from "react-icons/si";
const channelOptions: { value: InquiryChannel; label: string }[] = [
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Instagram", label: "Instagram" },
  { value: "Facebook", label: "Facebook" },
  { value: "Phone Call", label: "Phone Call" },
  { value: "Walk-in", label: "Walk-in" },
  { value: "Other", label: "Other" },
];

const statusOptions: { value: InquiryStatus; label: string }[] = [
  { value: "New", label: "New" },
  { value: "Contacted", label: "Contacted" },
  { value: "Quoted", label: "Quoted" },
  { value: "Won", label: "Won" },
  { value: "Lost", label: "Lost" },
];

const lostReasons = [
  "Price too high",
  "No response",
  "Chose a competitor",
  "Not ready yet",
  "Other",
];

type FormData = {
  customer_name: string;
  customer_phone: string;
  channel: InquiryChannel;
  message: string;
  status: InquiryStatus;
  estimated_value: string;
  notes: string;
  follow_up_date: string;
  lost_reason: string;
};

const emptyForm: FormData = {
  customer_name: "",
  customer_phone: "",
  channel: "WhatsApp",
  message: "",
  status: "New",
  estimated_value: "",
  notes: "",
  follow_up_date: "",
  lost_reason: "",
};

type Props = {
  inquiry?: Inquiry | null;
  open: boolean;
  onClose: () => void;
  onSaved: (inquiry: Inquiry) => void;
};

export default function InquiryModal({ inquiry, open, onClose, onSaved }: Props) {
  const { businessId } = useAuth();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState("");

  // Load templates for quick reply
  useEffect(() => {
    if (businessId) {
      getTemplates(businessId).then(setTemplates).catch(() => {});
    }
  }, [businessId]);

  // Populate form when editing
  useEffect(() => {
    if (inquiry) {
      setForm({
        customer_name: inquiry.customer_name,
        customer_phone: inquiry.customer_phone ?? "",
        channel: inquiry.channel,
        message: inquiry.message,
        status: inquiry.status,
        estimated_value: inquiry.estimated_value?.toString() ?? "",
        notes: inquiry.notes ?? "",
        follow_up_date: inquiry.follow_up_date ?? "",
        lost_reason: inquiry.lost_reason ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setError("");
  }, [inquiry, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    if (!form.customer_name.trim()) {
      setError("Customer name is required");
      return;
    }
    if (!form.message.trim()) {
      setError("Message is required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (inquiry) {
        const updated = await updateInquiry(inquiry.id, {
          customer_name: form.customer_name,
          customer_phone: form.customer_phone || null,
          channel: form.channel,
          message: form.message,
          status: inquiry.status !== form.status ? form.status : undefined,
          estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
          notes: form.notes || null,
          follow_up_date: form.follow_up_date || null,
          lost_reason:
            form.status === "Lost" ? (form.lost_reason || null) : null,
          status_changed_at:
            inquiry.status !== form.status ? new Date().toISOString() : undefined,
        });
        onSaved(updated);
      } else {
        const created = await createInquiry({
          business_id: businessId,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone || null,
          channel: form.channel,
          message: form.message,
          status: form.status,
          estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
          notes: form.notes || null,
          follow_up_date: form.follow_up_date || null,
          lost_reason:
            form.status === "Lost" ? (form.lost_reason || null) : null,
        });
        onSaved(created);
      }
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (tpl: Template) => {
    setForm((prev) => ({ ...prev, message: tpl.message_text }));
    setShowTemplates(false);
  };

  const fieldClass =
    "w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 flex items-start justify-center pt-8 md:pt-16 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 mb-8 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              {inquiry ? "Edit Inquiry" : "New Inquiry"}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-secondary hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className={labelClass}>
                Customer Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, customer_name: e.target.value }))
                }
                className={fieldClass}
                placeholder="e.g. John Doe"
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                type="text"
                value={form.customer_phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, customer_phone: e.target.value }))
                }
                className={fieldClass}
                placeholder="e.g. +1 555-0123"
              />
            </div>

            {/* Channel */}
            <div>
              <label className={labelClass}>Channel</label>
              <div className="grid grid-cols-3 gap-2">
                {channelOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, channel: opt.value }))
                    }
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      form.channel === opt.value
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-background text-secondary border-border hover:border-primary/40"
                    }`}
                  >
                    {opt.value === "WhatsApp" && (
                      <MessageSquare className="w-3.5 h-3.5" />
                    )}
                    {opt.value === "Instagram" && (
                      <Instagram className="w-3.5 h-3.5" />
                    )}
                    {opt.value === "Facebook" && (
                      <Facebook className="w-3.5 h-3.5" />
                    )}
                    {opt.value === "Phone Call" && (
                      <Phone className="w-3.5 h-3.5" />
                    )}
                    {opt.value === "Walk-in" && (
                      <Users className="w-3.5 h-3.5" />
                    )}
                    {opt.value === "Other" && (
                      <MessageSquare className="w-3.5 h-3.5" />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message + Quick Reply */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>
                  Message <span className="text-destructive">*</span>
                </label>
                {templates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTemplates((prev) => !prev)}
                    className="text-xs text-accent hover:text-accent/80 font-medium cursor-pointer transition-colors"
                  >
                    {showTemplates ? "Hide templates" : "Quick replies"}
                  </button>
                )}
              </div>
              {showTemplates && templates.length > 0 && (
                <div className="mb-2 p-2 bg-muted rounded-lg border border-border space-y-1 max-h-28 overflow-y-auto">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="block w-full text-left px-3 py-2 rounded-md text-xs text-foreground hover:bg-white transition-colors cursor-pointer"
                    >
                      <span className="font-medium">{tpl.title}</span>
                      <span className="text-secondary ml-2">
                        — {tpl.message_text.slice(0, 60)}...
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={form.message}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, message: e.target.value }))
                }
                rows={3}
                className={fieldClass + " resize-none"}
                placeholder="Customer's message..."
              />
            </div>

            {/* Status */}
            <div>
              <label className={labelClass}>Status</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, status: opt.value }))
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      form.status === opt.value
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-background text-secondary border-border hover:border-primary/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lost reason */}
            {form.status === "Lost" && (
              <div>
                <label className={labelClass}>Lost Reason</label>
                <select
                  value={form.lost_reason}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, lost_reason: e.target.value }))
                  }
                  className={fieldClass}
                >
                  <option value="">Select a reason</option>
                  {lostReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Estimated Value */}
            <div>
              <label className={labelClass}>Estimated Value ($)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.estimated_value}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, estimated_value: e.target.value }))
                }
                className={fieldClass}
                placeholder="e.g. 500"
              />
            </div>

            {/* Follow-up Date */}
            <div>
              <label className={labelClass}>Follow-up Date</label>
              <input
                type="date"
                value={form.follow_up_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, follow_up_date: e.target.value }))
                }
                className={fieldClass}
              />
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
                className={fieldClass + " resize-none"}
                placeholder="Internal notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-secondary hover:text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2.5 text-sm font-medium text-on-primary bg-primary rounded-lg hover:opacity-90 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {inquiry ? "Save Changes" : "Create Inquiry"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
