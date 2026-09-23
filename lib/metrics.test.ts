import { describe, expect, it } from "vitest";
import { calculateConversionRate, isWithinDateRange } from "./metrics";

describe("conversion rate", () => {
  it("mengeluarkan Not a Lead dari perhitungan", () => {
    expect(calculateConversionRate({ converted: 2, closed: 2, notALead: 100 })).toBe(50);
  });

  it("mengembalikan nol bila belum ada lead dengan hasil final", () => {
    expect(calculateConversionRate({ converted: 0, closed: 0, notALead: 5 })).toBe(0);
  });
});

describe("filter tanggal metrik", () => {
  it("memakai batas awal dan akhir secara inklusif", () => {
    expect(isWithinDateRange("2026-09-23T00:00:00", "2026-09-23", "2026-09-23")).toBe(true);
    expect(isWithinDateRange("2026-09-23T23:59:59", "2026-09-23", "2026-09-23")).toBe(true);
  });

  it("mengeluarkan data di luar rentang", () => {
    expect(isWithinDateRange("2026-09-22T23:59:59", "2026-09-23", "")).toBe(false);
    expect(isWithinDateRange("2026-09-24T00:00:00", "", "2026-09-23")).toBe(false);
  });
});
