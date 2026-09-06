import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PropertyCalendarGrid } from "./property-calendar-grid";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("PropertyCalendarGrid", () => {
  it("keeps a one-night owner-block label visible instead of truncating it", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T12:00:00"));

    render(
      <PropertyCalendarGrid
        blocks={[
          {
            id: "owner-stay",
            propertyId: "property-305",
            startDate: "2026-09-15",
            endDate: "2026-09-15",
            reason: "manual_block",
            notes: "Owner Stay / Maintenance",
          },
        ]}
      />,
    );

    const label = screen.getByText("Owner Stay / Maintenance");
    expect(label).toHaveClass("whitespace-nowrap", "overflow-visible");
    expect(label).not.toHaveClass("truncate");
  });

  it("clears a selected date when that date is clicked again", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T12:00:00"));

    render(<PropertyCalendarGrid blocks={[]} />);

    const day = screen.getByText("26");
    fireEvent.click(day);
    expect(screen.getByText("Selected Range")).toBeInTheDocument();

    fireEvent.click(day);
    expect(screen.queryByText("Selected Range")).not.toBeInTheDocument();
  });
});
