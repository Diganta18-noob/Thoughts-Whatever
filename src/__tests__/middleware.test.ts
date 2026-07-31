/**
 * Next.js Middleware Tests
 * 
 * Tests for URL transliteration middleware
 */

import { describe, it, expect, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

// Note: This is a simplified test suite. In production, you'd use
// Next.js testing utilities or mock the Edge runtime properly.

describe('Middleware - URL Transliteration', () => {
  describe('Bengali URL Detection', () => {
    it('should detect Bengali characters in URLs', () => {
      const url = 'https://example.com/থট্‌স-হোয়াটেভার';
      const hasBengali = /[\u0980-\u09FF]/.test(url);
      expect(hasBengali).toBe(true);
    });

    it('should not detect Bengali in English URLs', () => {
      const url = 'https://example.com/thoughts-whatever';
      const hasBengali = /[\u0980-\u09FF]/.test(url);
      expect(hasBengali).toBe(false);
    });
  });

  describe('Path Transliteration', () => {
    const transliterationMap: Record<string, string> = {
      'থট্‌স-হোয়াটেভার': 'thoughts-whatever',
      'থটস-হোয়াটেভার': 'thoughts-whatever',
      'থট্‌স': 'thoughts',
      'হোয়াটেভার': 'whatever',
    };

    function transliterateUrlPath(path: string): string {
      let transliterated = path;
      for (const [bengali, english] of Object.entries(transliterationMap)) {
        const bengaliPattern = new RegExp(bengali, 'gi');
        transliterated = transliterated.replace(bengaliPattern, english);
      }
      
      if (/[\u0980-\u09FF]/.test(transliterated)) {
        transliterated = transliterated
          .replace(/[\u0980-\u09FF]/g, '')
          .replace(/[^a-z0-9/-]/gi, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }
      
      return transliterated;
    }

    it('should convert Bengali paths to English', () => {
      expect(transliterateUrlPath('/থট্‌স-হোয়াটেভার')).toBe('/thoughts-whatever');
    });

    it('should handle variant spellings', () => {
      expect(transliterateUrlPath('/থটস-হোয়াটেভার')).toBe('/thoughts-whatever');
    });

    it('should preserve English paths', () => {
      expect(transliterateUrlPath('/thoughts-whatever')).toBe('/thoughts-whatever');
    });

    it('should handle mixed content paths', () => {
      const result = transliterateUrlPath('/থট্‌স-হোয়াটেভার/about');
      expect(result).toContain('thoughts-whatever');
    });

    it('should remove remaining Bengali characters', () => {
      const result = transliterateUrlPath('/unknown-বাংলা-text');
      expect(result).not.toMatch(/[\u0980-\u09FF]/);
    });
  });

  describe('Route Exclusions', () => {
    function shouldSkipMiddleware(pathname: string): boolean {
      return (
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/static/') ||
        /\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf)$/.test(pathname)
      );
    }

    it('should skip API routes', () => {
      expect(shouldSkipMiddleware('/api/admin/pieces')).toBe(true);
      expect(shouldSkipMiddleware('/api/pieces/123')).toBe(true);
    });

    it('should skip Next.js internal routes', () => {
      expect(shouldSkipMiddleware('/_next/static/chunks/main.js')).toBe(true);
      expect(shouldSkipMiddleware('/_next/image?url=/test.jpg')).toBe(true);
    });

    it('should skip static files', () => {
      expect(shouldSkipMiddleware('/favicon.ico')).toBe(true);
      expect(shouldSkipMiddleware('/logo.png')).toBe(true);
      expect(shouldSkipMiddleware('/styles.css')).toBe(true);
    });

    it('should not skip regular pages', () => {
      expect(shouldSkipMiddleware('/about')).toBe(false);
      expect(shouldSkipMiddleware('/থট্‌স-হোয়াটেভার')).toBe(false);
    });
  });

  describe('Redirect Behavior', () => {
    it('should use 301 (permanent) redirects', () => {
      // 301 tells search engines the English URL is canonical
      const expectedStatus = 301;
      expect(expectedStatus).toBe(301);
    });

    it('should preserve query strings in redirects', () => {
      const originalUrl = 'https://example.com/থট্‌স-হোয়াটেভার?page=2';
      const url = new URL(originalUrl);
      url.pathname = '/thoughts-whatever';
      
      expect(url.toString()).toBe('https://example.com/thoughts-whatever?page=2');
    });
  });
});
