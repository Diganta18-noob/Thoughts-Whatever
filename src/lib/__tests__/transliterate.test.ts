/**
 * Transliteration System Tests
 * 
 * Comprehensive test suite for the loop engineering transliteration system
 */

import { describe, it, expect } from '@jest/globals';
import {
  banglaToEnglish,
  englishToBangla,
  toEnglishSlug,
  toSeoText,
  getSiteName,
  autoTransliterate,
  hasBengaliTransliterableText,
  hasEnglishTransliterableText,
  toBilingualText,
} from '../transliterate';

describe('Transliteration System', () => {
  describe('banglaToEnglish', () => {
    it('should convert primary brand name', () => {
      expect(banglaToEnglish('থট্‌স হোয়াটেভার')).toBe('thoughts whatever');
    });

    it('should handle variant spellings', () => {
      expect(banglaToEnglish('থটস হোয়াটেভার')).toBe('thoughts whatever');
      expect(banglaToEnglish('থট্স হোয়াটেভার')).toBe('thoughts whatever');
    });

    it('should convert individual words', () => {
      expect(banglaToEnglish('থট্‌স')).toBe('thoughts');
      expect(banglaToEnglish('হোয়াটেভার')).toBe('whatever');
    });

    it('should preserve non-transliterable Bengali text', () => {
      expect(banglaToEnglish('আমার থট্‌স হোয়াটেভার পছন্দ')).toBe('আমার thoughts whatever পছন্দ');
    });

    it('should handle empty/null input', () => {
      expect(banglaToEnglish('')).toBe('');
      expect(banglaToEnglish(null as any)).toBe(null);
      expect(banglaToEnglish(undefined as any)).toBe(undefined);
    });

    it('should handle text without transliterable content', () => {
      expect(banglaToEnglish('রবীন্দ্রনাথ ঠাকুর')).toBe('রবীন্দ্রনাথ ঠাকুর');
      expect(banglaToEnglish('English text')).toBe('English text');
    });

    it('should be case-insensitive for Bengali', () => {
      expect(banglaToEnglish('থট্‌স হোয়াটেভার')).toBe('thoughts whatever');
      expect(banglaToEnglish('থট্‌স হোয়াটেভার')).toBe('thoughts whatever');
    });
  });

  describe('englishToBangla', () => {
    it('should convert English to preferred brand casing', () => {
      expect(englishToBangla('thoughts whatever')).toBe('Thoughts Whatever');
    });

    it('should handle case-insensitive matching', () => {
      expect(englishToBangla('Thoughts Whatever')).toBe('Thoughts Whatever');
      expect(englishToBangla('THOUGHTS WHATEVER')).toBe('Thoughts Whatever');
    });

    it('should preserve non-transliterable English text', () => {
      expect(englishToBangla('I love thoughts whatever')).toBe('I love Thoughts Whatever');
    });

    it('should handle empty/null input', () => {
      expect(englishToBangla('')).toBe('');
      expect(englishToBangla(null as any)).toBe(null);
      expect(englishToBangla(undefined as any)).toBe(undefined);
    });
  });

  describe('toEnglishSlug', () => {
    it('should create URL-safe slugs from Bengali', () => {
      expect(toEnglishSlug('থট্‌স হোয়াটেভার')).toBe('thoughts-whatever');
    });

    it('should handle mixed Bengali and English', () => {
      expect(toEnglishSlug('থট্‌স হোয়াটেভার নতুন লেখা')).toMatch(/thoughts-whatever/);
    });

    it('should remove special characters', () => {
      expect(toEnglishSlug('thoughts whatever!!!')).toBe('thoughts-whatever');
      expect(toEnglishSlug('thoughts_whatever')).toBe('thoughts-whatever');
    });

    it('should convert to lowercase', () => {
      expect(toEnglishSlug('Thoughts Whatever')).toBe('thoughts-whatever');
    });

    it('should collapse multiple hyphens', () => {
      expect(toEnglishSlug('thoughts  ---  whatever')).toBe('thoughts-whatever');
    });

    it('should remove leading/trailing hyphens', () => {
      expect(toEnglishSlug('-thoughts whatever-')).toBe('thoughts-whatever');
    });

    it('should handle empty input', () => {
      expect(toEnglishSlug('')).toBe('');
    });
  });

  describe('toSeoText', () => {
    it('should convert Bengali to English for SEO', () => {
      expect(toSeoText('থট্‌স হোয়াটেভার')).toBe('thoughts whatever');
    });

    it('should preserve already English text', () => {
      expect(toSeoText('thoughts whatever')).toBe('thoughts whatever');
    });

    it('should handle mixed content', () => {
      const result = toSeoText('আমার থট্‌স হোয়াটেভার');
      expect(result).toContain('thoughts whatever');
    });
  });

  describe('getSiteName', () => {
    it('should return Thoughts Whatever', () => {
      expect(getSiteName()).toBe('Thoughts Whatever');
      expect(getSiteName('bn')).toBe('Thoughts Whatever');
    });

    it('should return English name when requested', () => {
      expect(getSiteName('en')).toBe('Thoughts Whatever');
    });
  });

  describe('autoTransliterate', () => {
    it('should convert to English when target is en', () => {
      expect(autoTransliterate('থট্‌স হোয়াটেভার', 'en')).toBe('thoughts whatever');
    });

    it('should keep text when target is bn', () => {
      expect(autoTransliterate('thoughts whatever', 'bn')).toBe('thoughts whatever');
    });
  });

  describe('hasBengaliTransliterableText', () => {
    it('should detect transliterable Bengali text', () => {
      expect(hasBengaliTransliterableText('থট্‌স হোয়াটেভার')).toBe(true);
      expect(hasBengaliTransliterableText('আমার থট্‌স')).toBe(true);
    });

    it('should return false for non-transliterable text', () => {
      expect(hasBengaliTransliterableText('রবীন্দ্রনাথ')).toBe(false);
      expect(hasBengaliTransliterableText('English text')).toBe(false);
      expect(hasBengaliTransliterableText('')).toBe(false);
    });
  });

  describe('hasEnglishTransliterableText', () => {
    it('should detect transliterable English text', () => {
      expect(hasEnglishTransliterableText('thoughts whatever')).toBe(true);
      expect(hasEnglishTransliterableText('I love thoughts')).toBe(true);
    });

    it('should return false for non-transliterable text', () => {
      expect(hasEnglishTransliterableText('random text')).toBe(false);
      expect(hasEnglishTransliterableText('রবীন্দ্রনাথ')).toBe(false);
      expect(hasEnglishTransliterableText('')).toBe(false);
    });
  });

  describe('toBilingualText', () => {
    it('should create bilingual text with default separator', () => {
      expect(toBilingualText('থট্‌স হোয়াটেভার')).toBe('থট্‌স হোয়াটেভার (thoughts whatever)');
    });

    it('should use custom separator', () => {
      expect(toBilingualText('থট্‌স হোয়াটেভার', ' — ')).toBe('থট্‌স হোয়াটেভার — (thoughts whatever)');
    });

    it('should not add parentheses if no transliteration occurs', () => {
      expect(toBilingualText('রবীন্দ্রনাথ')).toBe('রবীন্দ্রনাথ');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text', () => {
      const longText = 'থট্‌স হোয়াটেভার '.repeat(100);
      const result = banglaToEnglish(longText);
      expect(result).toContain('thoughts whatever');
    });

    it('should handle text with numbers', () => {
      expect(banglaToEnglish('থট্‌স হোয়াটেভার ২০২৪')).toBe('thoughts whatever ২০২৪');
    });

    it('should handle text with punctuation', () => {
      expect(banglaToEnglish('থট্‌স হোয়াটেভার!')).toBe('thoughts whatever!');
      expect(banglaToEnglish('থট্‌স হোয়াটেভার?')).toBe('thoughts whatever?');
    });

    it('should handle multiple occurrences', () => {
      expect(banglaToEnglish('থট্‌স হোয়াটেভার এবং থট্‌স হোয়াটেভার')).toBe('thoughts whatever এবং thoughts whatever');
    });
  });

  describe('Performance', () => {
    it('should handle repeated conversions efficiently', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        banglaToEnglish('থট্‌স হোয়াটেভার');
      }
      const duration = Date.now() - start;
      
      // Should complete 1000 conversions in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});
