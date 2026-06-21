import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getInquiries, updateInquiry, type InquiryFilters } from "../lib/api";
import type { Inquiry, InquiryStatus, InquiryChannel } from "../lib/database.types";
import StatusBadge from "../components/StatusBadge";
import InquiryModal from "../components/InquiryModal";
import InquiryDetail from "../components/InquiryDetail";
import KanbanBoard from "../components/KanbanBoard";
import {
  Search, Download, Trash2, MessageSquare, Phone, Instagram, Facebook, Users,
  ChevronDown, ChevronUp, Loader2, Plus, Pencil,
} from "lucide-react";

const channelIconMap: Record<InquiryChannel, React.ReactNode> = {
  WhatsApp: <MessageSquare className="w-4 h-4" />,
  Instagram: <Instagram className="w-4 h-4" />,
  Facebook: <Facebook className="w-4 h-4" />,
  "Phone Call": <Phone className="w-4 h-4" />,
  "Walk-in": <Users className="w-4 h-4" />,
  Other: <MessageSquare className="w-4 h-4" />,
};

const channelColors: Record<InquiryChannel, string> = {
  WhatsApp: "text-green-600 bg-green-50",
  Instagram: "text-pink-600 bg-pink-50",
  Facebook: "text-blue-600 bg-blue-50",
  "Phone Call": "text-amber-600 bg-amber-50",
  "Walk-in": "text-teal-600 bg-teal-50",
  Other: "text-gray-600 bg-gray-50",
};

const statusOptions: InquiryStatus[] = ["New", "Contacted", "Quoted", "Won", "Lost"];
const channelOptions: InquiryChannel[] = [
  "WhatsApp", "Instagram", "Facebook", "Phone Call", "Walk-in", "Other",
];

export default function Inbox() {
  const { businessId } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [filters, setFilters] = useState<InquiryFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [sortField, setSortField] = useState<keyof Inquiry>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [openStatusDropdown, setOpenStatusDropdown] = useState(false);
  const [openChannelDropdown, setOpenChannelDropdown] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<Inquiry | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const fetchInquiries = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await getInquiries(businessId, filters);
      setInquiries(data);
    } catch { console.error("Failed to fetch inquiries"); }
    finally { setLoading(false); }
  }, [businessId, filters]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput || undefined }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSort = (field: keyof Inquiry) => {
    if (sortField === field) setSortAsc((prev) => !prev);
    else { setSortField(field); setSortAsc(true); }
  };

  const sorted = [...inquiries].sort((a, b) => {
    const aVal = a[sortField], bVal = b[sortField];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    return (sortAsc ? 1 : -1) * (aVal < bVal ? -1 : aVal > bVal ? 1 : 0);
  });

  const exportCSV = () => {
    const headers = ["Customer Name","Channel","Message","Status","Estimated Value","Customer Phone","Notes","Created At"];
    const rows = sorted.map((i) => [
      i.customer_name, i.channel, i.message, i.status,
      i.estimated_value?.toString() ?? "", i.customer_phone ?? "", i.notes ?? "",
      new Date(i.created_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openAddModal = () => { setEditingInquiry(null); setModalOpen(true); };
  const openEditModal = (inquiry: Inquiry) => { setEditingInquiry(inquiry); setModalOpen(true); };

  const handleSaved = (updated: Inquiry) => {
    setInquiries((prev) => {
      const idx = prev.findIndex((i) => i.id === updated.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = updated; return copy; }
      return [updated, ...prev];
    });
    setModalOpen(false);
    setSelectedInquiry(updated);
  };

  const handleDetailUpdated = (updated: Inquiry) => {
    setInquiries((prev) => {
      const idx = prev.findIndex((i) => i.id === updated.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = updated; return copy; }
      return prev;
    });
    setSelectedInquiry(updated);
  };

  const handleDetailDeleted = (id: string) => {
    setInquiries((prev) => prev.filter((i) => i.id !== id));
    setSelectedInquiry(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      const { deleteInquiry } = await import("../lib/api");
      await deleteInquiry(id);
      setInquiries((prev) => prev.filter((i) => i.id !== id));
    } catch { console.error("Failed to delete inquiry"); }
  };

  const handleKanbanStatusChange = async (id: string, newStatus: InquiryStatus) => {
    try {
      const updated = await updateInquiry(id, {
        status: newStatus,
        status_changed_at: new Date().toISOString(),
      });
      setInquiries((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch { console.error("Failed to update status"); }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr), now = new Date();
    const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatValue = (val: number | null) => {
    if (val == null) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (filters.status) activeFilters.push({ label: `Status: ${filters.status}`, onRemove: () => setFilters((prev) => ({ ...prev, status: undefined })) });
  if (filters.channel) activeFilters.push({ label: `Channel: ${filters.channel}`, onRemove: () => setFilters((prev) => ({ ...prev, channel: undefined })) });

  const SortIcon = ({ field }: { field: keyof Inquiry }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp className="w-3.5 h-3.5 inline ml-1" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-1" />;
  };

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none";

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Inbox</h1>
          <p className="text-secondary mt-1 text-sm">Manage your customer inquiries</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-lg p-0.5 border border-border">
            <button onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer ${viewMode === "table" ? "bg-white text-foreground shadow-sm" : "text-secondary hover:text-foreground"}`}>Table</button>
            <button onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer ${viewMode === "kanban" ? "bg-white text-foreground shadow-sm" : "text-secondary hover:text-foreground"}`}>Board</button>
          </div>
          <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg hover:opacity-90 transition-all duration-150 cursor-pointer text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" /> New Inquiry
          </button>
          <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all duration-150 cursor-pointer text-sm font-medium shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
            <input type="text" placeholder="Search customer or message..." value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all" />
          </div>
          <div className="relative">
            <button onClick={() => { setOpenStatusDropdown((prev) => !prev); setOpenChannelDropdown(false); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-all duration-150 cursor-pointer min-w-[130px] justify-between">
              {filters.status || "All Statuses"} <ChevronDown className="w-4 h-4 text-secondary" />
            </button>
            {openStatusDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenStatusDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-border rounded-lg shadow-lg z-20 py-1">
                  <button onClick={() => { setFilters((prev) => ({ ...prev, status: undefined })); setOpenStatusDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer">All Statuses</button>
                  {statusOptions.map((s) => (
                    <button key={s} onClick={() => { setFilters((prev) => ({ ...prev, status: s })); setOpenStatusDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-2"><StatusBadge status={s} /></button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button onClick={() => { setOpenChannelDropdown((prev) => !prev); setOpenStatusDropdown(false); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-all duration-150 cursor-pointer min-w-[130px] justify-between">
              {filters.channel || "All Channels"} <ChevronDown className="w-4 h-4 text-secondary" />
            </button>
            {openChannelDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenChannelDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-border rounded-lg shadow-lg z-20 py-1">
                  <button onClick={() => { setFilters((prev) => ({ ...prev, channel: undefined })); setOpenChannelDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer">All Channels</button>
                  {channelOptions.map((c) => (
                    <button key={c} onClick={() => { setFilters((prev) => ({ ...prev, channel: c })); setOpenChannelDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-2">
                      <span className={`p-1 rounded ${channelColors[c]}`}>{channelIconMap[c]}</span> {c}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {activeFilters.map((chip) => (
              <span key={chip.label} className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                {chip.label}
                <button onClick={chip.onRemove} className="hover:bg-accent/20 rounded-full p-0.5 cursor-pointer transition-colors" aria-label={`Remove ${chip.label} filter`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className={thClass} onClick={() => handleSort("customer_name")}>Customer Name <SortIcon field="customer_name" /></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Message</th>
                  <th className={thClass} onClick={() => handleSort("status")}>Status <SortIcon field="status" /></th>
                  <th className={`${thClass} hidden md:table-cell`} onClick={() => handleSort("estimated_value")}>Value <SortIcon field="estimated_value" /></th>
                  <th className={`${thClass} hidden lg:table-cell`} onClick={() => handleSort("created_at")}>Date <SortIcon field="created_at" /></th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-16 text-center text-secondary"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /><span className="text-sm">Loading...</span></td></tr>
                ) : sorted.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-16 text-center"><MessageSquare className="w-10 h-10 text-secondary/40 mx-auto mb-3" /><p className="text-foreground font-medium mb-1">No inquiries yet</p><p className="text-secondary text-sm">{filters.status || filters.channel || filters.search ? "Try adjusting your filters" : "Customer inquiries will appear here"}</p></td></tr>
                ) : (
                  sorted.map((inq) => (
                    <tr key={inq.id} onClick={() => setSelectedInquiry(inq)} className="hover:bg-muted/50 transition-colors group cursor-pointer">
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-foreground">{inq.customer_name}</span>
                        {inq.customer_phone && <span className="text-xs text-secondary ml-2 hidden sm:inline">{inq.customer_phone}</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${channelColors[inq.channel]}`}>{channelIconMap[inq.channel]} {inq.channel}</span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px]"><p className="text-sm text-foreground truncate">{inq.message}</p></td>
                      <td className="px-4 py-3.5"><StatusBadge status={inq.status} /></td>
                      <td className="px-4 py-3.5 text-sm text-foreground hidden md:table-cell">{formatValue(inq.estimated_value)}</td>
                      <td className="px-4 py-3.5 text-sm text-secondary hidden lg:table-cell whitespace-nowrap">{formatDate(inq.created_at)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); openEditModal(inq); }}
                            className="p-1.5 text-secondary hover:text-accent hover:bg-accent/10 rounded-md transition-all duration-150 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label={`Edit ${inq.customer_name}`}><Pencil className="w-4 h-4" /></button>
                          <button onClick={(e) => handleDelete(inq.id, e)}
                            className="p-1.5 text-secondary hover:text-destructive hover:bg-red-50 rounded-md transition-all duration-150 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label={`Delete ${inq.customer_name}`}><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && sorted.length > 0 && (
            <div className="px-4 py-3 border-t border-border bg-muted/30 text-xs text-secondary">
              Showing {sorted.length} of {inquiries.length} inquiry{inquiries.length !== 1 ? "ies" : "y"}
            </div>
          )}
        </div>
      ) : (
        loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
        ) : (
          <KanbanBoard inquiries={sorted} onStatusChange={handleKanbanStatusChange} onSelect={(inq) => setSelectedInquiry(inq)} />
        )
      )}

      <InquiryModal inquiry={editingInquiry} open={modalOpen} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <InquiryDetail inquiry={selectedInquiry!} open={selectedInquiry !== null}
        onClose={() => setSelectedInquiry(null)} onUpdated={handleDetailUpdated} onDeleted={handleDetailDeleted} />
    </div>
  );
}