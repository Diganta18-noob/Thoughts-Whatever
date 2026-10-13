"use client";

import { Children, Fragment, cloneElement, isValidElement, type ReactNode, type ReactElement } from "react";
import Link from "next/link";
import { useLanguageSafe as useLanguage } from "@/components/providers/language-provider";
import { needsEnglishTranslation } from "@/lib/content-translation";
import { useTranslatedText } from "./translation-store";

const SKIP = new Set(["script", "style", "code", "pre", "textarea", "svg"]);
const ATTRIBUTES = ["aria-label", "title", "placeholder", "alt"] as const;

function isContainer(element: ReactElement<Record<string, unknown>>) {
  const type = element.type;
  return typeof type === "string" || type === Fragment || type === Link ||
    ((typeof type === "object" || typeof type === "function") && type !== null && Symbol.for("motionComponentSymbol") in type);
}

function TextChunk({ text }: { text: string }) { return <>{useTranslatedText(text)}</>; }
function Text({ text }: { text: string }) {
  if (text.length <= 6000) return <TextChunk text={text} />;
  const chunks: string[] = [];
  let remainder = text;
  while (remainder.length > 6000) {
    let end = remainder.lastIndexOf(" ", 6000);
    if (end < 3000) end = 6000;
    chunks.push(remainder.slice(0, end));
    remainder = remainder.slice(end);
  }
  chunks.push(remainder);
  return <>{chunks.map((chunk, index) => <TextChunk key={index} text={chunk} />)}</>;
}

function Element({ element }: { element: ReactElement<Record<string, unknown>> }) {
  const { isBn } = useLanguage();
  const props = element.props;
  // Fixed hook order: attributes are translated as strings and never as markup.
  const ariaLabel = useTranslatedText(typeof props["aria-label"] === "string" ? props["aria-label"] : "");
  const title = useTranslatedText(typeof props.title === "string" ? props.title : "");
  const placeholder = useTranslatedText(typeof props.placeholder === "string" ? props.placeholder : "");
  const alt = useTranslatedText(typeof props.alt === "string" ? props.alt : "");
  const updates: Record<string, unknown> = {};
  const values = { "aria-label": ariaLabel, title, placeholder, alt };
  ATTRIBUTES.forEach(key => { if (typeof props[key] === "string") updates[key] = values[key]; });
  if (!isBn && props.lang === "bn") updates.lang = "en";
  if (!isBn && typeof props.className === "string") updates.className = props.className.replace(/\bfont-bengali(?:-sans)?\b/g, "font-serif");
  if (props.children !== undefined && isContainer(element)) updates.children = walk(props.children as ReactNode);
  return cloneElement(element, updates);
}

function walk(children: ReactNode): ReactNode {
  return Children.map(children, child => {
    if (typeof child === "string") return needsEnglishTranslation(child) ? <Text text={child} /> : child;
    if (!isValidElement<Record<string, unknown>>(child)) return child;
    // Opaque client components localize their own rendered children. A nested
    // boundary must not be traversed twice. Code and JSON-LD remain originals.
    if (child.type === TranslatedContent || (typeof child.type === "string" && SKIP.has(child.type))) return child;
    if (typeof child.type === "string" || child.props.lang === "bn" || ATTRIBUTES.some(key => typeof child.props[key] === "string" && needsEnglishTranslation(child.props[key] as string))) return <Element element={child} />;
    // Components such as react-markdown require string children, while others
    // require one element. Only known transparent containers expose their slot.
    return isContainer(child) && child.props.children !== undefined ? cloneElement(child, { children: walk(child.props.children as ReactNode) }) : child;
  });
}

/** Translates React text leaves while preserving links, handlers, refs and structure. */
export function TranslatedContent({ children }: { children: ReactNode }) {
  return <>{walk(children)}</>;
}
