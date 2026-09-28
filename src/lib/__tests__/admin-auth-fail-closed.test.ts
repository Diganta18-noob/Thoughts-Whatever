const findUnique = jest.fn();
const update = jest.fn().mockResolvedValue(undefined);
let accessToken: string | undefined;
jest.mock('next/headers', () => ({ cookies: () => ({ get: (name: string) => name === 'tw_access' && accessToken ? { value: accessToken } : undefined }) }));
jest.mock('@/lib/prisma', () => ({ prisma: { adminUser: { findUnique: (...args: unknown[]) => findUnique(...args), update: (...args: unknown[]) => update(...args) } } }));

import { createAccessToken, invalidateAdminCache, requireAdmin } from '../auth';

describe('admin identity verification', () => {
  beforeAll(() => { process.env.AUTH_SECRET = 'test-only-admin-identity-secret-32-bytes'; });
  beforeEach(() => { findUnique.mockReset(); invalidateAdminCache(); accessToken = createAccessToken('removed-admin', 'former@example.com'); });
  it('rejects a signed token when the admin row was deleted', async () => {
    findUnique.mockResolvedValue(null);
    expect(await requireAdmin()).toBeNull();
  });
  it('rejects a signed token when the database is unavailable', async () => {
    findUnique.mockRejectedValue(new Error('database unavailable'));
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    try { expect(await requireAdmin()).toBeNull(); } finally { error.mockRestore(); }
  });
  it('uses the current database role instead of a token role', async () => {
    findUnique.mockResolvedValue({ id: 'removed-admin', email: 'former@example.com', nameBn: null, role: 'VIEWER', status: 'active' });
    expect((await requireAdmin())?.role).toBe('VIEWER');
  });
});
