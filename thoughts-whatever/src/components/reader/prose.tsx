import { Children, type ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { firstGrapheme, splitLeadParagraph } from "@/lib/markdown";
import { cn } from "@/lib/utils";

/**
 * The reading surface.
 *
 * Renders markdown at request time rather than at build time, so fixing a
 * typo in the admin editor is live immediately — which matters when the
 * writing is the product.
 */

type Components = NonNullable<React.ComponentProps<typeof Markdown>["components"]>;

/**
 * Heading ids are derived from the source line number so they match
 * `extractHeadings()` exactly, and so two sections that happen to share a
 * title still get distinct anchors. Slugifying Bengali headings would
 * collide and produce dead contents links.
 */
const baseComponents: Components = {
  h2: ({ node, children }) => (
    <h2 id={`section-${(node?.position?.start.line ?? 1) - 1}`}>{children}</h2>
  ),
  h3: ({ node, children }) => (
    <h3 id={`section-${(node?.position?.start.line ?? 1) - 1}`}>{children}</h3>
  ),

  a: ({ href, children }) => {
    const external = !!href && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },

  /**
   * ```verse fenced blocks hold কবিতা. Line breaks in verse are authorial,
   * so the block preserves them instead of letting the browser re-wrap.
   */
  code: ({ className, children }) => {
    if (className?.includes("language-verse")) {
      return <div className="verse">{String(children).replace(/\n$/, "")}</div>;
    }
    return <code className={className}>{children}</code>;
  },

  // The verse renderer already emits its own block, so the surrounding <pre>
  // would double-wrap it.
  pre: ({ children }) => <>{children}</>,

  img: ({ src, alt }) =>
    typeof src === "string" ? (
      <figure>
        {/* Editorial images are arbitrary remote URLs pasted by the author, so
            next/image's host allowlist would reject most of them. A plain img
            with lazy loading is the right trade here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" />
        {alt && <figcaption>{alt}</figcaption>}
      </figure>
    ) : null,
};

/**
 * Same renderers, but the paragraph gets a drop cap grafted onto its first
 * grapheme cluster. Splitting the *rendered children* rather than the raw
 * markdown means inline emphasis, links, and italics in the opening sentence
 * survive intact — a lead paragraph is exactly where an author is most likely
 * to italicise a book title.
 */
const leadComponents: Components = {
  ...baseComponents,
  p: ({ children }) => {
    const parts = Children.toArray(children);
    const [first, ...remainder] = parts;

    if (typeof first === "string") {
      const split = firstGrapheme(first);
      if (split) {
        return (
          <p>
            <span className="dropcap">{split.head}</span>
            {split.tail}
            {remainder as ReactNode[]}
          </p>
        );
      }
    }

    // Paragraph opens with a link or emphasis — no clean cluster to cap.
    return <p>{children}</p>;
  },
};

export function Prose({
  body,
  dropCap = false,
  className,
}: {
  body: string;
  dropCap?: boolean;
  className?: string;
}) {
  const { lead, rest } = dropCap
    ? splitLeadParagraph(body)
    : { lead: null, rest: body };

  return (
    <div className={cn("prose-bengali", className)} lang="bn">
      {lead && (
        <Markdown remarkPlugins={[remarkGfm]} components={leadComponents}>
          {lead}
        </Markdown>
      )}
      {rest && (
        <Markdown remarkPlugins={[remarkGfm]} components={baseComponents}>
          {rest}
        </Markdown>
      )}
    </div>
  );
}
