import ReferenceLibraryPage from '@/app/reference/page';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({ prisma: {
  referenceWork: { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
  referenceSource: { count: jest.fn() },
} }));

describe('Reference catalogue query budget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.referenceWork.count as jest.Mock).mockResolvedValue(0);
    (prisma.referenceWork.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.referenceWork.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.referenceSource.count as jest.Mock).mockResolvedValue(0);
  });

  it('uses one filtered count and one grouped catalogue query, including an empty catalogue', async () => {
    await ReferenceLibraryPage({searchParams:{}});
    expect(prisma.referenceWork.count).toHaveBeenCalledTimes(1);
    expect(prisma.referenceWork.groupBy).toHaveBeenCalledWith({by:['type'],where:{published:true},_count:{_all:true}});
    expect(prisma.referenceSource.count).toHaveBeenCalledTimes(1);
  });

  it('keeps card results bounded and excludes manifests, rights notes and unused asset metadata', async () => {
    await ReferenceLibraryPage({searchParams:{page:'2'}});
    const args=(prisma.referenceWork.findMany as jest.Mock).mock.calls[0][0];
    expect(args).toMatchObject({take:12,skip:12});
    expect(args.include).toBeUndefined();
    expect(args.select?.editions.select.readerManifest).toBeUndefined();
    expect(args.select?.editions.select.assets.select.transcriptText).toBe(true);
    expect(args.select?.editions.select.assets.select.waveformData).toBeUndefined();
    expect(args.select?.editions.select.rights).toEqual({select:{status:true}});
  });

  it('applies search/type/rights only to results, leaving global catalogue statistics unfiltered', async () => {
    await ReferenceLibraryPage({searchParams:{q:'test',type:'AUDIO',rights:'PUBLIC_DOMAIN'}});
    const args=(prisma.referenceWork.count as jest.Mock).mock.calls[0][0];
    expect(args.where).toMatchObject({published:true,type:'AUDIO',editions:{some:{rights:{status:'PUBLIC_DOMAIN'}}}});
    expect(args.where.OR).toHaveLength(6);
    expect(prisma.referenceWork.groupBy).toHaveBeenCalledWith({by:['type'],where:{published:true},_count:{_all:true}});
  });
});
