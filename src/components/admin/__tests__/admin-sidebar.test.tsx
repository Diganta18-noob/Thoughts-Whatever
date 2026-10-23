/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { AdminSidebar } from "../admin-sidebar";
jest.mock("next/navigation", () => ({ usePathname: () => "/admin" }));

describe("admin navigation", () => {
  beforeEach(() => localStorage.clear());
  it("keeps daily content visible and secondary groups collapsed until opened", () => {
    render(<AdminSidebar />);
    expect(screen.getByRole("button", { name: "Content" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Intelligence" })).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByRole("button", { name: "Intelligence" }));
    expect(screen.getByRole("button", { name: "Intelligence" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  });
});
