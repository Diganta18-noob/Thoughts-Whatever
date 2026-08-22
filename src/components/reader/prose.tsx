import { Children, type ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { firstGrapheme, splitLeadParagraph, stripThoughtsSignature } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { ArticleSignature } from "@/components/reader/article-signature";

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
  h4: ({ node, children }) => (
    <h4 id={`section-${(node?.position?.start.line ?? 1) - 1}`}>{children}</h4>
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

  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-accent pl-5 font-bengali text-lg italic text-content-soft">
      {children}
    </blockquote>
  ),

  hr: () => (
    <div className="my-8 flex items-center justify-center gap-2 text-content-faint">
      <span className="h-[1px] w-12 bg-rule" />
      <span className="font-serif text-sm">❖</span>
      <span className="h-[1px] w-12 bg-rule" />
    </div>
  ),

  code: ({ className, children }) => {
    if (className?.includes("language-verse")) {
      return <div className="verse font-bengali my-6 pl-4 border-l border-rule/60 text-base leading-relaxed text-content">{String(children).replace(/\n$/, "")}</div>;
    }
    if (className?.includes("language-callout")) {
      return (
        <div className="my-6 rounded-md border border-accent/30 bg-accent/5 p-4 text-content">
          {String(children).replace(/\n$/, "")}
        </div>
      );
    }
    return <code className={className}>{children}</code>;
  },

  pre: ({ children }) => <>{children}</>,

  img: ({ src, alt }) =>
    typeof src === "string" ? (
      <figure className="my-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ""}
          loading="lazy"
          decoding="async"
          className="rounded-md border border-rule/60 shadow-sm"
        />
        {alt && <figcaption className="mt-2 text-center text-xs text-content-faint">{alt}</figcaption>}
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
  showSignature = true,
}: {
  body: string;
  dropCap?: boolean;
  className?: string;
  showSignature?: boolean;
}) {
  // Strip manual/stray signatures first to guarantee uniqueness
  let cleanBody = stripThoughtsSignature(body);

  // Strip code fences ```markdown ... ``` or stray leading ## headers if present
  cleanBody = cleanBody.replace(/^```[a-z]*\n?/gi, "").replace(/\n?```$/gi, "").trim();
  cleanBody = cleanBody.replace(/^#{1,3}\s+[^\n]+\n+/, "").trim();
  cleanBody = cleanBody.replace(/^```[a-z]*\n?/gi, "").replace(/\n?```$/gi, "").trim();

  // Re-strip signature in case code fences wrapped it
  cleanBody = stripThoughtsSignature(cleanBody);

  const { lead, rest } = dropCap
    ? splitLeadParagraph(cleanBody)
    : { lead: null, rest: cleanBody };

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
      {showSignature && <ArticleSignature />}
    </div>
  );
}
