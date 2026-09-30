/** @jest-environment jsdom */
import { render, act, cleanup } from "@testing-library/react";
import Lenis from "lenis";
import { SmoothScroll } from "../smooth-scroll";

let mockPath = "/";
jest.mock("next/navigation", () => ({ usePathname: () => mockPath }));
jest.mock("lenis", () => jest.fn().mockImplementation(() => ({ destroy: jest.fn() })));

describe("smooth scroll lifecycle", () => {
  let preference: { matches: boolean; addEventListener: jest.Mock; removeEventListener: jest.Mock };
  beforeEach(() => {
    mockPath = "/";
    jest.clearAllMocks();
    preference = { matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() };
    window.matchMedia = jest.fn().mockReturnValue(preference);
  });
  afterEach(cleanup);

  it("destroys smoothing immediately when reduced motion changes", () => {
    render(<SmoothScroll />);
    const instance = (Lenis as jest.Mock).mock.results[0].value;
    preference.matches = true;
    act(() => preference.addEventListener.mock.calls[0][1]());
    expect(instance.destroy).toHaveBeenCalledTimes(1);
    expect(Lenis).toHaveBeenCalledTimes(1);
  });

  it.each(["/admin", "/reference/book/read", "/reference/book/listen"])("keeps %s native", (path) => {
    mockPath = path;
    render(<SmoothScroll />);
    expect(Lenis).not.toHaveBeenCalled();
  });

  it("cleans up on navigation and respects an existing motion preference", () => {
    const view = render(<SmoothScroll />);
    const instance = (Lenis as jest.Mock).mock.results[0].value;
    mockPath = "/admin";
    view.rerender(<SmoothScroll />);
    expect(instance.destroy).toHaveBeenCalledTimes(1);
    expect(preference.removeEventListener).toHaveBeenCalled();
    view.unmount();
    mockPath = "/";
    preference.matches = true;
    render(<SmoothScroll />);
    expect(Lenis).toHaveBeenCalledTimes(1);
  });
});
