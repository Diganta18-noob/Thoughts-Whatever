/**
 * Jest Setup File
 * 
 * Runs before all tests to configure the testing environment
 */

// Add custom matchers or global test utilities here if needed

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SITE_NAME = 'Thoughts Whatever';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
