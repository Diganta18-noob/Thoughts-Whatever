/**
 * Jest Setup File
 * 
 * Runs before all tests to configure the testing environment
 */

// React.cache polyfill for Next.js App Router unit testing
const React = require("react");
if (!React.cache) {
  React.cache = (fn) => fn;
}

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SITE_NAME = 'Thoughts Whatever';
process.env.NEXT_PUBLIC_SITE_URL = 'https://www.thoughtswhatever.in';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
