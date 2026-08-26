import { describe, it, expect } from "vitest";
import { authAPI, projectsAPI, timesheetsAPI, apiClient } from "./api";

describe("API Services", () => {
  it("exports apiClient and endpoints", () => {
    expect(apiClient).toBeDefined();
    expect(authAPI.login).toBeInstanceOf(Function);
    expect(authAPI.register).toBeInstanceOf(Function);
    expect(authAPI.getMe).toBeInstanceOf(Function);

    expect(projectsAPI.listProjects).toBeInstanceOf(Function);
    expect(projectsAPI.createProject).toBeInstanceOf(Function);
    expect(projectsAPI.getProject).toBeInstanceOf(Function);
    expect(projectsAPI.updateProject).toBeInstanceOf(Function);
    expect(projectsAPI.deleteProject).toBeInstanceOf(Function);

    expect(timesheetsAPI.listTimesheets).toBeInstanceOf(Function);
    expect(timesheetsAPI.createTimesheet).toBeInstanceOf(Function);
    expect(timesheetsAPI.getTimesheet).toBeInstanceOf(Function);
    expect(timesheetsAPI.updateTimesheet).toBeInstanceOf(Function);
    expect(timesheetsAPI.deleteTimesheet).toBeInstanceOf(Function);
    expect(timesheetsAPI.approveTimesheet).toBeInstanceOf(Function);
    expect(timesheetsAPI.bulkApproveTimesheets).toBeInstanceOf(Function);
    expect(timesheetsAPI.getSummary).toBeInstanceOf(Function);
  });
});
