describe("canonical site URL", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each(["http://localhost:3000", "http://127.0.0.1:3000"])(
    "uses the public origin in production with %s configured",
    (localUrl) => {
      jest.replaceProperty(process, "env", {
        ...process.env,
        NODE_ENV: "production",
        NEXT_PUBLIC_SITE_URL: localUrl,
      });
      jest.isolateModules(() => {
        const { absoluteUrl } = require("../utils");
        expect(absoluteUrl("/archive")).toBe("https://www.thoughtswhatever.in/archive");
      });
    },
  );

  it("preserves the local origin in development", () => {
    jest.replaceProperty(process, "env", {
      ...process.env,
      NODE_ENV: "development",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3100/",
    });
    jest.isolateModules(() => {
      const { absoluteUrl } = require("../utils");
      expect(absoluteUrl("/archive")).toBe("http://localhost:3100/archive");
    });
  });
});
