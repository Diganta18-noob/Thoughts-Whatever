/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { ReferenceRightsBadge } from "../reference-rights-badge";
import { TransportBar } from "../audio/transport-bar";

describe("reference display controls", () => {
  it("omits the public-domain badge while retaining other statuses", () => {
    const { container, rerender } = render(<ReferenceRightsBadge status="PUBLIC_DOMAIN" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<ReferenceRightsBadge status="LICENSED" />);
    expect(screen.getByText("Licensed")).toBeInTheDocument();
  });
  it("has no audio download link and retains playback controls", () => {
    const { container } = render(<TransportBar currentTime={10} duration={100} rate={1} isMuted={false} onSkip={jest.fn()} onSetRate={jest.fn()} onToggleMute={jest.fn()} audioUrl="https://example.com/audio.m4a" />);
    expect(container.querySelector('a[download]')).toBeNull();
    expect(screen.getByText("-15s")).toBeInTheDocument();
    expect(screen.getByText("+15s")).toBeInTheDocument();
  });
});
