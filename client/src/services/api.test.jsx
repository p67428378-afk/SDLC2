import { describe, it, expect } from "vitest";
import api, {
  getKpiMetrics,
  getSkus,
  getSkuByCode,
  evaluateScenario,
  getScenarios,
  checkGuardrails,
  createSubmission,
  getSubmissions,
  getSubmissionByAuditId,
} from "./api.js";

describe("API Service Exports", () => {
  it("exports all expected API service methods", () => {
    expect(typeof getKpiMetrics).toBe("function");
    expect(typeof getSkus).toBe("function");
    expect(typeof getSkuByCode).toBe("function");
    expect(typeof evaluateScenario).toBe("function");
    expect(typeof getScenarios).toBe("function");
    expect(typeof checkGuardrails).toBe("function");
    expect(typeof createSubmission).toBe("function");
    expect(typeof getSubmissions).toBe("function");
    expect(typeof getSubmissionByAuditId).toBe("function");
  });

  it("default export contains all required service functions", () => {
    expect(typeof api.getKpiMetrics).toBe("function");
    expect(typeof api.getSkus).toBe("function");
    expect(typeof api.createSubmission).toBe("function");
  });
});
