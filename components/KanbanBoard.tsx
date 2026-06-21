import { useState, useCallback, type DragEvent } from "react";
import type { Inquiry, InquiryStatus } from "../lib/database.types";
import StatusBadge from "./StatusBadge";
import { MessageSquare, Phone, Users, GripVertical } from "lucide-react";
import { SiInstagram as Instagram, SiFacebook as Facebook } from "react-icons/si";

const columns: { id: InquiryStatus; label: string }[] = [
  { id: "New", label: "New" },
  { id: "Contacted", label: "Contacted" },
  { id: "Quoted", label: "Quoted" },
  { id: "Won", label: "Won" },
  { id: "Lost", label: "Lost" },
];

const channelIcons: Record<string, React.ReactNode> = {
  WhatsApp: <MessageSquare className="w-3 h-3" />,
  Instagram: <Instagram className="w-3 h-3" />,
  Facebook: <Facebook className="w-3 h-3" />,
  "Phone Call": <Phone className="w-3 h-3" />,
  "Walk-in": <Users className="w-3 h-3" />,
  Other: <MessageSquare className="w-3 h-3" />,
};

type Props = {
  inquiries: Inquiry[];
  onStatusChange: (id: string, newStatus: InquiryStatus) => void;
  onSelect: (inquiry: Inquiry) => void;
};

export default function KanbanBoard({ inquiries, onStatusChange, onSelect }: Props) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: DragEvent, inquiryId: string) => {
    e.dataTransfer.setData("text/plain", inquiryId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(inquiryId);
  }, []);

  const handleDragOver = useCallback((e: DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent, columnId: InquiryStatus) => {
      e.preventDefault();
      const inquiryId = e.dataTransfer.getData("text/plain");
      if (inquiryId) {
        onStatusChange(inquiryId, columnId);
      }
      setDragOverColumn(null);
      setDraggedId(null);
    },
    [onStatusChange]
  );

  const handleDragEnd = useCallback(() => {
    setDragOverColumn(null);
    setDraggedId(null);
  }, []);

  const groupByStatus = (status: InquiryStatus) =>
    inquiries.filter((i) => i.status === status);

  const formatValue = (val: number | null) => {
    if (val == null) return "";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {columns.map((col) => {
        const items = groupByStatus(col.id);
        const isOver = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`bg-muted/40 rounded-xl border transition-all duration-150 ${
              isOver ? "border-accent bg-accent/5" : "border-border"
            }`}
          >
            {/* Column header */}
            <div className="px-3 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge status={col.id} />
                <span className="text-xs text-secondary font-medium">{items.length}</span>
              </div>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 min-h-[60px]">
              {items.map((inquiry) => (
                <div
                  key={inquiry.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, inquiry.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelect(inquiry)}
                  className={`bg-white rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-150 ${
                    draggedId === inquiry.id ? "opacity-50 shadow-lg" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-secondary/40 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {inquiry.customer_name}
                        </p>
                        <p className="text-xs text-secondary mt-0.5 line-clamp-2">
                          {inquiry.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <span className="inline-flex items-center gap-1 text-xs text-secondary">
                      {channelIcons[inquiry.channel]}
                      {inquiry.channel === "Phone Call" ? "Phone" : inquiry.channel}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-secondary">
                      {inquiry.estimated_value && (
                        <span className="font-medium text-foreground">{formatValue(inquiry.estimated_value)}</span>
                      )}
                      <span>{formatDate(inquiry.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="py-8 text-center text-xs text-secondary/60">
                  Drop inquiries here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
