/** @jest-environment jsdom */
import { render, screen, fireEvent } from "@testing-library/react";
import { Children, type ReactElement } from "react";
import { TranslatedContent } from "../translated-content";
import LocalizedLink from "../localized-link";

let mockIsBn = false;
jest.mock("@/components/providers/language-provider", () => ({ useLanguageSafe: () => ({ isBn: mockIsBn, locale: mockIsBn ? "bn" : "en" }) }));
jest.mock("../translation-store", () => ({ useTranslatedText: (text: string) => mockIsBn ? text : ({ "পরে পড়ব": "Read later", "গোপনীয়তা নীতি": "Privacy Policy" }[text] || text) }));

describe("translated page content", () => {
  afterEach(() => { mockIsBn = false; });
  it("translates server-rendered text, attributes, and language without losing button behavior", () => {
    const onClick = jest.fn();
    render(<TranslatedContent><section lang="bn"><h1>পরে পড়ব</h1><button onClick={onClick} aria-label="গোপনীয়তা নীতি">পরে পড়ব</button></section></TranslatedContent>);
    expect(screen.getByRole("heading").textContent).toBe("Read later");
    expect(screen.getByRole("heading").closest("section")).toHaveAttribute("lang", "en");
    fireEvent.click(screen.getByRole("button", { name: "Privacy Policy" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it("restores the exact Bengali source when the language changes", () => {
    const { rerender } = render(<TranslatedContent><h1>পরে পড়ব</h1></TranslatedContent>);
    mockIsBn = true;
    rerender(<TranslatedContent><h1>পরে পড়ব</h1></TranslatedContent>);
    expect(screen.getByRole("heading").textContent).toBe("পরে পড়ব");
  });
  it("preserves URLs and does not translate code or JSON-LD", () => {
    render(<TranslatedContent><a href="/writing/বাংলা">পরে পড়ব</a><code>পরে পড়ব</code></TranslatedContent>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/writing/বাংলা");
    expect(document.querySelector("code")?.textContent).toBe("পরে পড়ব");
  });
  it.each([false, true])("preserves opaque component string-children contracts (Bengali=%s)", (isBn) => {
    mockIsBn = isBn;
    function StringConsumer({ children }: { children: string }) {
      if (typeof children !== "string") throw new Error("Markdown requires string children");
      return <p>{children}</p>;
    }
    expect(() => render(<TranslatedContent><StringConsumer>{isBn ? "বাংলা লেখা" : "English **writing**"}</StringConsumer></TranslatedContent>)).not.toThrow();
  });
  it("preserves a custom component's single-element child", () => {
    function SingleChild({ children }: { children: ReactElement }) { return Children.only(children); }
    expect(() => render(<TranslatedContent><SingleChild><button>Continue</button></SingleChild></TranslatedContent>)).not.toThrow();
  });
  it("localizes a link's own slot even when its parent treats it as opaque", () => {
    render(<TranslatedContent><LocalizedLink href="/letter"><span>পরে পড়ব</span></LocalizedLink></TranslatedContent>);
    expect(screen.getByRole("link", { name: "Read later" })).toHaveAttribute("href", "/letter");
  });
});
