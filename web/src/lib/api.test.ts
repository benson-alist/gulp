import { describe, expect, it } from "vitest";
import { discountPct, formatUSD } from "./api";

describe("formatUSD", () => {
  it("formats whole dollars without cents by default", () => {
    expect(formatUSD(12)).toBe("$12");
    expect(formatUSD(0)).toBe("$0");
    expect(formatUSD(1234)).toBe("$1,234");
  });

  it("formats with cents when asked", () => {
    expect(formatUSD(12.5, { cents: true })).toBe("$12.50");
  });
});

describe("discountPct", () => {
  it("returns 0 when there is no original_price", () => {
    expect(discountPct(10, null)).toBe(0);
  });

  it("returns 0 when original_price is not actually higher", () => {
    expect(discountPct(10, 8)).toBe(0);
    expect(discountPct(10, 10)).toBe(0);
  });

  it("computes the discount percentage, rounded", () => {
    expect(discountPct(10, 40)).toBe(75);
    expect(discountPct(12, 52)).toBe(77);
    expect(discountPct(18, 24)).toBe(25);
  });
});
