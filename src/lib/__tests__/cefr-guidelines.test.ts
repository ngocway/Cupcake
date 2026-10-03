import { describe, it, expect } from "vitest";
import { getCefrPedagogicalGuidelines } from "../cefr-guidelines";

describe("CEFR Pedagogical Guidelines Utility", () => {
  it("should return beginner guidelines for Pre-A1 and A1 levels", () => {
    const resA1 = getCefrPedagogicalGuidelines("a1");
    expect(resA1).toContain("Pre-A1 to A1 (Beginner)");
    expect(resA1).toContain("Subject-Verb-Object");
    expect(resA1).toContain("Present Simple");

    const resPreA1 = getCefrPedagogicalGuidelines("pre-a1");
    expect(resPreA1).toContain("Pre-A1 to A1 (Beginner)");

    const resBeginner = getCefrPedagogicalGuidelines("beginner");
    expect(resBeginner).toContain("Pre-A1 to A1 (Beginner)");
  });

  it("should return elementary guidelines for A2 level", () => {
    const resA2 = getCefrPedagogicalGuidelines("a2");
    expect(resA2).toContain("A2 (Elementary)");
    expect(resA2).toContain("Past Simple");
    expect(resA2).toContain("Comparatives/Superlatives");

    const resElem = getCefrPedagogicalGuidelines("elementary");
    expect(resElem).toContain("A2 (Elementary)");
  });

  it("should return intermediate guidelines for B1 level", () => {
    const resB1 = getCefrPedagogicalGuidelines("b1");
    expect(resB1).toContain("B1 (Intermediate)");
    expect(resB1).toContain("Present Perfect");
    expect(resB1).toContain("First and Second Conditionals");

    const resInter = getCefrPedagogicalGuidelines("intermediate");
    expect(resInter).toContain("B1 (Intermediate)");
  });

  it("should return upper-intermediate/advanced guidelines for B2 and above", () => {
    const resB2 = getCefrPedagogicalGuidelines("b2");
    expect(resB2).toContain("B2 (Upper-Intermediate)");
    expect(resB2).toContain("Participle clauses");
    expect(resB2).toContain("Third and Mixed Conditionals");

    const resC1 = getCefrPedagogicalGuidelines("c1");
    expect(resC1).toContain("B2 (Upper-Intermediate)");
  });

  it("should handle mixed case and whitespace correctly", () => {
    const res = getCefrPedagogicalGuidelines("   A1   ");
    expect(res).toContain("Pre-A1 to A1 (Beginner)");
  });
});
