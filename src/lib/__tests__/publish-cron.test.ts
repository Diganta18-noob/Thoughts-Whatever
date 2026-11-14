const mockFindMany = jest.fn();
const mockUpdateMany = jest.fn();
const mockRevalidate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: { piece: {
    findMany: (...args: unknown[]) => mockFindMany(...args),
    updateMany: (...args: unknown[]) => mockUpdateMany(...args),
  } },
}));
jest.mock("@/lib/admin-api", () => ({
  revalidatePiece: (...args: unknown[]) => mockRevalidate(...args),
}));

import { GET } from "@/app/api/cron/publish/route";

const testSecret = "isolated-test-secret";
const previous = process.env.CRON_SECRET;
const request = (token: string) => new Request("http://localhost/api/cron/publish", {
  headers: { authorization: `Bearer ${token}` },
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.CRON_SECRET = testSecret;
});
afterAll(() => {
  if (previous === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = previous;
});

test("rejects unauthorized calls before querying for due articles", async () => {
  expect((await GET(request("wrong"))).status).toBe(401);
  expect(mockFindMany).not.toHaveBeenCalled();
});

test("only invalidates the cache for the invocation that claims the article", async () => {
  mockFindMany.mockResolvedValue([{ id: "1", kind: "WRITING", slug: "due" }]);
  mockUpdateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

  const responses = await Promise.all([GET(request(testSecret)), GET(request(testSecret))]);
  const results = await Promise.all(responses.map((response) => response.json()));
  expect(results.map((result) => result.published).sort()).toEqual([0, 1]);
  expect(mockRevalidate).toHaveBeenCalledTimes(1);
});
