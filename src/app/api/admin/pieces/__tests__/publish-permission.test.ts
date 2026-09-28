import { NextResponse } from 'next/server';
const createPiece = jest.fn();
const updatePiece = jest.fn();
let role = 'AUTHOR';
let status = 'PUBLISHED';
jest.mock('@/lib/admin-api', () => ({
  guard: async () => ({ admin: { id: 'writer', role } }),
  readBody: async () => ({ data: { status, titleBn: 'Draft', slug: 'draft' } }),
  fail: (message: string, code: number) => NextResponse.json({ error: message }, { status: code }),
  ok: (data: unknown) => NextResponse.json(data),
  revalidatePiece: jest.fn(),
}));
jest.mock('@/lib/admin-pieces', () => ({ createPiece: (...args: unknown[]) => createPiece(...args), updatePiece: (...args: unknown[]) => updatePiece(...args), isSlugTaken: () => false }));
jest.mock('@/lib/audit', () => ({ auditPieceAction: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: { piece: { findUnique: jest.fn(), delete: jest.fn() } } }));
import { POST } from '../route';
import { PUT } from '../[id]/route';

it('prevents an author from publishing through create and update APIs', async () => {
  role = 'AUTHOR'; status = 'PUBLISHED';
  expect((await POST(new Request('http://localhost/api/admin/pieces',{method:'POST'}))).status).toBe(403);
  expect((await PUT(new Request('http://localhost/api/admin/pieces/x',{method:'PUT'}),{params:{id:'x'}})).status).toBe(403);
  expect(createPiece).not.toHaveBeenCalled();
  expect(updatePiece).not.toHaveBeenCalled();
});
