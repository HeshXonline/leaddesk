import { describe, it, expect } from "vitest";
import { computeDashboardMetrics } from "./metrics";
import type { Inquiry, InquiryStatus } from "./database.types";

let seq = 0;

/** Build an Inquiry with sensible defaults; override only what the test cares about. */
function makeInquiry(overrides: Partial<Inquiry> = {}): Inquiry {
  seq += 1;
  return {
    id: `inq-${seq}`,
    business_id: "biz-1",
    customer_name: "Customer",
    customer_phone: null,
    channel: "WhatsApp",
    message: "Hi",
    status: "New",
    estimated_value: null,
    lost_reason: null,
    follow_up_date: null,
    notes: null,
    status_changed_at: null,
    created_at: "2026-06-10T12:00:00.000Z",
    updated_at: "2026-06-10T12:00:00.000Z",
    ...overrides,
  };
}

const NOW = new Date("2026-06-24T12:00:00.000Z");

function withStatus(status: InquiryStatus, createdAt = NOW.toISOString()): Inquiry {
  return makeInquiry({ status, created_at: createdAt });
}

describe("computeDashboardMetrics", () => {
  it("returns zeroed metrics for an empty list", () => {
    const m = computeDashboardMetrics([], NOW);
    expect(m.total).toBe(0);
    expect(m.won).toBe(0);
    expect(m.lost).toBe(0);
    expect(m.conversionRate).toBe(0);
    expect(m.avgValue).toBe(0);
    expect(m.active).toBe(0);
    expect(m.statusBreakdown.every((s) => s.count === 0)).toBe(true);
    expect(m.monthlyData).toHaveLength(6);
    expect(m.monthlyData.every((p) => p.count === 0)).toBe(true);
  });

  it("counts totals and a per-status breakdown", () => {
    const inquiries = [
      withStatus("New"),
      withStatus("New"),
      withStatus("Contacted"),
      withStatus("Quoted"),
      withStatus("Won"),
      withStatus("Lost"),
    ];
    const m = computeDashboardMetrics(inquiries, NOW);

    expect(m.total).toBe(6);
    expect(m.won).toBe(1);
    expect(m.lost).toBe(1);
    const byStatus = Object.fromEntries(
      m.statusBreakdown.map((s) => [s.status, s.count])
    );
    expect(byStatus).toEqual({ New: 2, Contacted: 1, Quoted: 1, Won: 1, Lost: 1 });
  });

  it("treats New/Contacted/Quoted as active pipeline", () => {
    const inquiries = [
      withStatus("New"),
      withStatus("Contacted"),
      withStatus("Quoted"),
      withStatus("Won"),
      withStatus("Lost"),
    ];
    expect(computeDashboardMetrics(inquiries, NOW).active).toBe(3);
  });

  it("computes conversion rate as won / (won + lost), ignoring open inquiries", () => {
    // 3 won, 1 lost -> 75%. Two open inquiries must not dilute the rate.
    const inquiries = [
      withStatus("Won"),
      withStatus("Won"),
      withStatus("Won"),
      withStatus("Lost"),
      withStatus("New"),
      withStatus("Contacted"),
    ];
    expect(computeDashboardMetrics(inquiries, NOW).conversionRate).toBe(75);
  });

  it("returns 0 conversion when nothing is decided yet", () => {
    const inquiries = [withStatus("New"), withStatus("Quoted")];
    expect(computeDashboardMetrics(inquiries, NOW).conversionRate).toBe(0);
  });

  it("averages only this-month inquiries that carry an estimated value", () => {
    const inquiries = [
      makeInquiry({ estimated_value: 100, created_at: NOW.toISOString() }),
      makeInquiry({ estimated_value: 300, created_at: NOW.toISOString() }),
      // no value this month -> excluded from the average
      makeInquiry({ estimated_value: null, created_at: NOW.toISOString() }),
      // valued, but last month -> excluded
      makeInquiry({ estimated_value: 9999, created_at: "2026-05-15T12:00:00.000Z" }),
    ];
    expect(computeDashboardMetrics(inquiries, NOW).avgValue).toBe(200);
  });

  it("counts only the current calendar month for thisMonthTotal", () => {
    // Mid-month timestamps keep the test stable regardless of the runner's timezone.
    const inquiries = [
      makeInquiry({ created_at: "2026-06-10T12:00:00.000Z" }),
      makeInquiry({ created_at: "2026-06-20T12:00:00.000Z" }),
      makeInquiry({ created_at: "2026-05-15T12:00:00.000Z" }),
    ];
    expect(computeDashboardMetrics(inquiries, NOW).thisMonthTotal).toBe(2);
  });

  it("averages hours-to-first-contact over inquiries that have moved off New", () => {
    const inquiries = [
      // created -> contacted after 2h
      makeInquiry({
        status: "Contacted",
        created_at: "2026-06-10T00:00:00.000Z",
        status_changed_at: "2026-06-10T02:00:00.000Z",
      }),
      // created -> won after 4h
      makeInquiry({
        status: "Won",
        created_at: "2026-06-10T00:00:00.000Z",
        status_changed_at: "2026-06-10T04:00:00.000Z",
      }),
      // still New -> excluded
      makeInquiry({ status: "New", status_changed_at: null }),
      // moved off New but missing timestamp -> excluded
      makeInquiry({ status: "Quoted", status_changed_at: null }),
    ];
    expect(computeDashboardMetrics(inquiries, NOW).avgTimeToContact).toBe(3);
  });

  it("returns 0 time-to-contact when nothing has been contacted", () => {
    const inquiries = [makeInquiry({ status: "New", status_changed_at: null })];
    expect(computeDashboardMetrics(inquiries, NOW).avgTimeToContact).toBe(0);
  });

  it("produces a trailing 6-month series ending in the current month", () => {
    const m = computeDashboardMetrics([], NOW);
    expect(m.monthlyData.map((p) => p.month)).toEqual([
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
    ]);
  });
});
