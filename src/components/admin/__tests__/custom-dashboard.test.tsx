/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CustomDashboard } from "../custom-dashboard";

// Unrelated detail views: mounting them is the expensive action guarded by the dashboard.
jest.mock("../analytics-dashboard", () => ({ AnalyticsDashboard: () => <div>Detailed analytics loaded</div> }));
jest.mock("../reference-analytics-panel", () => ({ ReferenceAnalyticsPanel: () => <div>Reference analytics loaded</div> }));
jest.mock("../activity-widget", () => ({ AdminActivityWidget: () => <div>Recent activity</div> }));

describe("editorial overview", () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });
  it("shows recent writing without mounting detailed analytics until requested", async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ ok: true, widgets: [] }) });
    render(<CustomDashboard recentPieces={[{ id: "p1", slug: "essay", titleBn: "বাংলা রচনা", kind: "RACHANA", status: "DRAFT", updatedAt: "2026-10-24T00:00:00Z" }]} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.getByRole("link", { name: "বাংলা রচনা" })).toHaveAttribute("href", "/admin/pieces/p1");
    expect(screen.queryByText("Detailed analytics loaded")).not.toBeInTheDocument();
    expect(screen.queryByText("Reference analytics loaded")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show Analytics Overview" }));
    expect(await screen.findByText("Detailed analytics loaded")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide Analytics Overview" }));
    expect(screen.queryByText("Detailed analytics loaded")).not.toBeInTheDocument();
  });
});
