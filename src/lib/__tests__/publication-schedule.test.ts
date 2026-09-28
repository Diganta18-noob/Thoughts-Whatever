import { publicationState } from '../admin-pieces';

describe('publication scheduling', () => {
  const now = new Date('2026-09-28T10:00:00Z');
  it('keeps future publication hidden until a worker publishes it', () => {
    expect(publicationState('PUBLISHED', '2026-09-29T10:00:00Z', now)).toEqual({ status: 'DRAFT', reviewStatus: 'scheduled', publishedAt: new Date('2026-09-29T10:00:00Z') });
  });
  it('publishes an immediate publication normally', () => {
    expect(publicationState('PUBLISHED', null, now)).toEqual({ status: 'PUBLISHED', reviewStatus: 'published', publishedAt: now });
  });
});
