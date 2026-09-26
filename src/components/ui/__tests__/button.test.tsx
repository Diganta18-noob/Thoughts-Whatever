/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Publish</Button>);
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
  });

  it("applies the accent fill for the default primary variant", () => {
    render(<Button>Publish</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-accent");
  });

  it("applies the secondary variant instead of the primary fill", () => {
    render(<Button variant="secondary">Preview</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("bg-surface-raised");
    expect(btn).not.toHaveClass("bg-accent");
  });

  it("merges a caller className rather than dropping the variant", () => {
    render(<Button className="w-full">Publish</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("w-full");
    expect(btn).toHaveClass("bg-accent");
  });

  it("lets a caller override a conflicting utility via tailwind-merge", () => {
    render(<Button className="rounded-none">Publish</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("rounded-none");
    expect(btn).not.toHaveClass("rounded-card");
  });

  it("forwards the disabled attribute", () => {
    render(<Button disabled>Publish</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("forwards a ref to the underlying element", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Publish</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("defaults type to button so it cannot submit a form by accident", () => {
    render(<Button>Publish</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
