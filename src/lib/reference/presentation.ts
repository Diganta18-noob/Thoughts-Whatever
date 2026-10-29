// Explicit editorial presentation requested for this supplied reference.
// This does not assert a license or change its stored rights status.
export const GODDESS_REFERENCE_SLUG = "in-the-name-of-the-goddess";

export function isReadingOnlyReference(slug?: string) {
  return slug === GODDESS_REFERENCE_SLUG;
}
