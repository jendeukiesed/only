// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PointsDisplay } from "@/components/shared/points-display";

describe("<PointsDisplay />", () => {
  it("renders a formatted point amount", () => {
    render(<PointsDisplay amount={1234} />);
    expect(screen.getByText(/1,234/)).toBeInTheDocument();
  });

  it("prefixes a '+' sign for positive amounts when signed", () => {
    render(<PointsDisplay amount={50} signed />);
    expect(screen.getByText(/\+50/)).toBeInTheDocument();
  });

  it("does not add a '+' sign for negative amounts even when signed", () => {
    render(<PointsDisplay amount={-50} signed />);
    expect(screen.queryByText(/\+-50/)).not.toBeInTheDocument();
    expect(screen.getByText(/-50/)).toBeInTheDocument();
  });

  it("does not add any sign when signed is false (the default)", () => {
    const { container } = render(<PointsDisplay amount={50} />);
    expect(container.textContent).not.toContain("+50");
    expect(container.textContent).toContain("50");
  });
});
