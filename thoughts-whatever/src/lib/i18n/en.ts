import enJson from "../../../locales/en.json";

export const en = enJson;

export type TranslationKey = keyof typeof enJson;
export type Dictionary = Record<TranslationKey, string>;
