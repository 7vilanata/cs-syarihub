import { describe, expect, it } from "vitest";
import { calculateConversionRate } from "./metrics";

describe("conversion rate", () => {
  it("mengeluarkan Not a Lead dari perhitungan", () => {
    expect(calculateConversionRate({ converted: 2, closed: 2, notALead: 100 })).toBe(50);
  });

  it("mengembalikan nol bila belum ada lead dengan hasil final", () => {
    expect(calculateConversionRate({ converted: 0, closed: 0, notALead: 5 })).toBe(0);
  });
});
