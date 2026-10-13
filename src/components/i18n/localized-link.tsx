"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import NextLink from "next/link";
import { TranslatedContent } from "./translated-content";

/** Own the link's child slot after RSC resolves its opaque client reference. */
const LocalizedLink = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<typeof NextLink>>(
  function LocalizedLink(props, ref) {
    return <TranslatedContent><NextLink {...props} ref={ref}>{props.children}</NextLink></TranslatedContent>;
  },
);
export default LocalizedLink;
