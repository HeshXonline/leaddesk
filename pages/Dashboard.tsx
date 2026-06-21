import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import type { Inquiry } from "../lib/database.types";
import StatusBadge from "../components/StatusBadge";
import {
  TrendingUp, Users, DollarSign, Activity, Loader2, MessageSquare,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const { businessId } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    supabase
      .from("inquiries")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setInquiries(data as Inquiry[]);
        setLoading(false);
      });
  }, [businessId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const thisMonthInquiries = inquiries.filter((i) => {
    const d = new Date(i.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const total = inquiries.length;
  const thisMonthTotal = thisMonthInquiries.length;
  const won = inquiries.filter((i) => i.status === "Won").length;
  const lost = inquiries.filter((i) => i.status === "Lost").length;
  const conversionRate = total > 0 ? Math.round((won / (won + lost)) * 100) : 0;
  const avgValue =
    thisMonthInquiries.filter((i) => i.estimated_value).length > 0
      ? Math.round(
          thisMonthInquiries.reduce((s, i) => s + (i.estimated_value ?? 0), 0) /
            thisMonthInquiries.filter((i) => i.estimated_value).length
        )
      : 0;
  const active = inquiries.filter((i) =>
    ["New", "Contacted", "Quoted"].includes(i.status)
  ).length;

  const statusBreakdown = [
    { status: "New", count: inquiries.filter((i) => i.status === "New").length },
    { status: "Contacted", count: inquiries.filter((i) => i.status === "Contacted").length },
    { status: "Quoted", count: inquiries.filter((i) => i.status === "Quoted").length },
    { status: "Won", count: won },
    { status: "Lost", count: lost },
  ];

  // Monthly trend (last 6 months)
  const monthlyData: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const count = inquiries.filter((inq) => {
      const created = new Date(inq.created_at);
      return (
        created.getMonth() === d.getMonth() &&
        created.getFullYear() === d.getFullYear()
      );
    }).length;
    monthlyData.push({ month: label, count });
  }

  const StatCard = ({
    icon,
    label,
    value,
    sub,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-xl border border-border p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-secondary mb-1">{label}</p>
        <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-secondary mt-1">{sub}</p>}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-secondary mt-1 text-sm">
          Overview of your business inquiries
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<MessageSquare className="w-5 h-5 text-blue-600" />}
          label="This Month"
          value={thisMonthTotal}
          sub={`${total} total all time`}
          color="bg-blue-50"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          label="Conversion Rate"
          value={`${conversionRate}%`}
          sub={`${won} won, ${lost} lost`}
          color="bg-green-50"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-purple-600" />}
          label="Avg. Estimated Value"
          value={`$${avgValue.toLocaleString()}`}
          sub="This month"
          color="bg-purple-50"
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-amber-600" />}
          label="Active Inquiries"
          value={active}
          sub="New / Contacted / Quoted"
          color="bg-amber-50"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Monthly trend */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">
            Monthly Inquiries
          </h2>
          {monthlyData.every((d) => d.count === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart width={0} height={0} />
              <TrendingUp className="w-8 h-8 text-secondary/40 mb-2" />
              <p className="text-sm text-secondary">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.93 0.0035 247.86)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "oklch(0.4455 0.0374 257.28)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "oklch(0.4455 0.0374 257.28)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid oklch(0.93 0.0035 247.86)",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="oklch(0.596 0.1274 163.23)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status distribution */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">
            By Status
          </h2>
          <div className="space-y-3">
            {statusBreakdown.map((s) => {
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1">
                    <StatusBadge status={s.status as Inquiry["status"]} />
                    <span className="text-sm text-secondary">
                      {s.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          s.status === "New"
                            ? "oklch(0.596 0.1274 163.23)"
                            : s.status === "Contacted"
                            ? "oklch(0.707 0.165 47.72)"
                            : s.status === "Quoted"
                            ? "oklch(0.596 0.145 163.23)"
                            : s.status === "Won"
                            ? "oklch(0.627 0.194 149.21)"
                            : "oklch(0.577 0.215 27.33)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
