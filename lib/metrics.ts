import type { Inquiry, InquiryStatus } from "./database.types";

export type StatusBreakdown = { status: InquiryStatus; count: number };
export type MonthlyPoint = { month: string; count: number };

export type DashboardMetrics = {
  total: number;
  thisMonthTotal: number;
  won: number;
  lost: number;
  /** Won as a percentage of decided (Won + Lost) inquiries, rounded. 0 when none. */
  conversionRate: number;
  /** Average estimated_value of this month's valued inquiries, rounded. 0 when none. */
  avgValue: number;
  /** Inquiries still in the pipeline (New / Contacted / Quoted). */
  active: number;
  /** Average hours between creation and first status change, rounded. 0 when none. */
  avgTimeToContact: number;
  statusBreakdown: StatusBreakdown[];
  /** Inquiry counts for the trailing 6 months, oldest first. */
  monthlyData: MonthlyPoint[];
};

const ACTIVE_STATUSES: InquiryStatus[] = ["New", "Contacted", "Quoted"];

/**
 * Derive the Dashboard metrics from a list of inquiries.
 *
 * Pure and deterministic given `now`, which defaults to the current time but
 * is injectable so the result can be unit-tested.
 */
export function computeDashboardMetrics(
  inquiries: Inquiry[],
  now: Date = new Date()
): DashboardMetrics {
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const thisMonthInquiries = inquiries.filter((i) => {
    const d = new Date(i.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const total = inquiries.length;
  const won = inquiries.filter((i) => i.status === "Won").length;
  const lost = inquiries.filter((i) => i.status === "Lost").length;
  const decided = won + lost;
  const conversionRate = decided > 0 ? Math.round((won / decided) * 100) : 0;

  const valued = thisMonthInquiries.filter((i) => i.estimated_value);
  const avgValue =
    valued.length > 0
      ? Math.round(
          valued.reduce((s, i) => s + (i.estimated_value ?? 0), 0) /
            valued.length
        )
      : 0;

  const active = inquiries.filter((i) =>
    ACTIVE_STATUSES.includes(i.status)
  ).length;

  const contacted = inquiries.filter(
    (i) => i.status !== "New" && i.status_changed_at
  );
  const avgTimeToContact =
    contacted.length > 0
      ? Math.round(
          contacted.reduce((sum, i) => {
            const created = new Date(i.created_at).getTime();
            const changed = new Date(i.status_changed_at!).getTime();
            return sum + (changed - created) / (1000 * 60 * 60);
          }, 0) / contacted.length
        )
      : 0;

  const statusBreakdown: StatusBreakdown[] = [
    { status: "New", count: inquiries.filter((i) => i.status === "New").length },
    {
      status: "Contacted",
      count: inquiries.filter((i) => i.status === "Contacted").length,
    },
    {
      status: "Quoted",
      count: inquiries.filter((i) => i.status === "Quoted").length,
    },
    { status: "Won", count: won },
    { status: "Lost", count: lost },
  ];

  const monthlyData: MonthlyPoint[] = [];
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

  return {
    total,
    thisMonthTotal: thisMonthInquiries.length,
    won,
    lost,
    conversionRate,
    avgValue,
    active,
    avgTimeToContact,
    statusBreakdown,
    monthlyData,
  };
}
