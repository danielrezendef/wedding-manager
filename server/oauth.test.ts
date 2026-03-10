import { describe, expect, it } from "vitest";

describe("OAuth credentials", () => {
  it("VITE_GOOGLE_CLIENT_ID is set and has valid format", () => {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId!.length).toBeGreaterThan(5);
    // Google client IDs typically end with .apps.googleusercontent.com
    expect(clientId).toContain(".");
  });
});
