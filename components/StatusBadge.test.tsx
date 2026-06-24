import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";
import type { InquiryStatus } from "../lib/database.types";

describe("StatusBadge", () => {
  it("renders the status label", () => {
    render(<StatusBadge status="New" />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it.each([
    ["New", "text-blue-700"],
    ["Contacted", "text-yellow-700"],
    ["Quoted", "text-purple-700"],
    ["Won", "text-green-700"],
    ["Lost", "text-red-700"],
  ] as [InquiryStatus, string][])(
    "applies the %s color scheme",
    (status, expectedClass) => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(status)).toHaveClass(expectedClass);
    }
  );
});
