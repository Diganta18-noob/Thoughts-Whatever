import {
  normalizeError,
  containsTechnicalDetails,
  scrubSensitiveDetails,
  SAFE_ERROR_MESSAGES,
} from "../errors";

describe("normalizeError() - Centralized Error Normalization & Security", () => {
  describe("Null, Undefined, and Empty Inputs", () => {
    it("handles null gracefully", () => {
      const result = normalizeError(null);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.GENERIC);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.retryable).toBe(true);
    });

    it("handles undefined gracefully", () => {
      const result = normalizeError(undefined);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.GENERIC);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.retryable).toBe(true);
    });

    it("handles empty string gracefully", () => {
      const result = normalizeError("");
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.GENERIC);
    });
  });

  describe("Standard JavaScript Errors", () => {
    it("sanitizes generic Error object with internal message", () => {
      const err = new Error("Something broke inside module xyz");
      const result = normalizeError(err);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
      expect(result.retryable).toBe(true);
    });

    it("sanitizes TypeError (e.g. Cannot read properties of undefined)", () => {
      const err = new TypeError("Cannot read properties of undefined (reading 'titleBn')");
      const result = normalizeError(err);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
      expect(result.message).not.toContain("Cannot read properties");
      expect(result.message).not.toContain("titleBn");
    });

    it("sanitizes SyntaxError", () => {
      const err = new SyntaxError("Unexpected token '<', '<!DOCTYPE '... is not valid JSON");
      const result = normalizeError(err);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
      expect(result.message).not.toContain("Unexpected token");
    });
  });

  describe("Simulated Axios and HTTP Response Errors", () => {
    it("normalizes Axios 400 Bad Request with unsafe backend message", () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: "PrismaClientValidationError in query" },
        },
      };
      const result = normalizeError(axiosError);
      expect(result.statusCode).toBe(400);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.VALIDATION_ERROR);
      expect(result.message).not.toContain("PrismaClientValidationError");
    });

    it("normalizes Axios 400 with safe validation message", () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: "Please enter a valid email address." },
        },
      };
      const result = normalizeError(axiosError);
      expect(result.statusCode).toBe(400);
      expect(result.message).toBe("Please enter a valid email address.");
    });

    it("normalizes 401 Unauthorized", () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: "Unauthorized" },
        },
      };
      const result = normalizeError(axiosError);
      expect(result.statusCode).toBe(401);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.UNAUTHORIZED);
      expect(result.retryable).toBe(false);
    });

    it("normalizes 403 Forbidden", () => {
      const err = { response: { status: 403, data: "Forbidden" } };
      const result = normalizeError(err);
      expect(result.statusCode).toBe(403);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.FORBIDDEN);
      expect(result.retryable).toBe(false);
    });

    it("normalizes 404 Not Found", () => {
      const err = { response: { status: 404 } };
      const result = normalizeError(err);
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.NOT_FOUND);
      expect(result.retryable).toBe(false);
    });

    it("normalizes 409 Conflict", () => {
      const err = { response: { status: 409 } };
      const result = normalizeError(err);
      expect(result.statusCode).toBe(409);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.CONFLICT);
      expect(result.retryable).toBe(true);
    });

    it("normalizes 422 Unprocessable Entity", () => {
      const err = { response: { status: 422, data: { message: "Unsafe error" } } };
      const result = normalizeError(err);
      expect(result.statusCode).toBe(422);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.VALIDATION_ERROR);
    });

    it("normalizes 429 Rate Limited", () => {
      const err = { response: { status: 429 } };
      const result = normalizeError(err);
      expect(result.statusCode).toBe(429);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.RATE_LIMITED);
      expect(result.retryable).toBe(true);
    });

    it("normalizes 500 Internal Server Error", () => {
      const err = { response: { status: 500, data: { stack: "Error at line 45 in app.js" } } };
      const result = normalizeError(err);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
      expect(result.message).not.toContain("line 45");
      expect(result.retryable).toBe(true);
    });

    it("normalizes 502 / 503 / 504 Service Unavailable", () => {
      const err502 = { response: { status: 502 } };
      const err503 = { response: { status: 503 } };
      const err504 = { response: { status: 504 } };

      expect(normalizeError(err502).message).toBe(SAFE_ERROR_MESSAGES.SERVICE_UNAVAILABLE);
      expect(normalizeError(err503).message).toBe(SAFE_ERROR_MESSAGES.SERVICE_UNAVAILABLE);
      expect(normalizeError(err504).message).toBe(SAFE_ERROR_MESSAGES.SERVICE_UNAVAILABLE);
    });
  });

  describe("Network and Timeout Failures", () => {
    it("detects 'Failed to fetch' browser network error", () => {
      const err = new TypeError("Failed to fetch");
      const result = normalizeError(err);
      expect(result.code).toBe("NETWORK_ERROR");
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.NETWORK_ERROR);
      expect(result.retryable).toBe(true);
    });

    it("detects ECONNREFUSED error", () => {
      const err = new Error("connect ECONNREFUSED 127.0.0.1:5432");
      const result = normalizeError(err);
      expect(result.code).toBe("NETWORK_ERROR");
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.NETWORK_ERROR);
      expect(result.message).not.toContain("ECONNREFUSED");
      expect(result.message).not.toContain("127.0.0.1");
    });

    it("detects timeout error", () => {
      const err = new Error("Operation timed out after 5000ms");
      const result = normalizeError(err);
      expect(result.code).toBe("TIMEOUT");
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.TIMEOUT);
      expect(result.retryable).toBe(true);
    });

    it("detects AbortError timeout", () => {
      const err = new Error("The user aborted a request.");
      err.name = "AbortError";
      const result = normalizeError(err);
      expect(result.code).toBe("TIMEOUT");
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.TIMEOUT);
    });
  });

  describe("Database and Infrastructure Protection", () => {
    it("sanitizes PrismaClientKnownRequestError", () => {
      const err = new Error(
        "PrismaClientKnownRequestError: Unique constraint failed on the fields: (`email`)"
      );
      const result = normalizeError(err);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
      expect(result.message).not.toContain("PrismaClient");
      expect(result.message).not.toContain("Unique constraint");
    });

    it("sanitizes MongoServerError", () => {
      const err = new Error(
        "MongoServerError: E11000 duplicate key error collection: mydb.users index: email_1"
      );
      const result = normalizeError(err);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
      expect(result.message).not.toContain("MongoServerError");
    });

    it("sanitizes PostgreSQL connection string error", () => {
      const err = new Error(
        "Connection failed: postgresql://admin:supersecret@db.prod.internal:5432/main"
      );
      const result = normalizeError(err);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
      expect(result.message).not.toContain("supersecret");
      expect(result.message).not.toContain("postgresql://");
      expect(result.message).not.toContain("db.prod.internal");
    });
  });

  describe("Raw JSON String Sanitization", () => {
    it("sanitizes stringified JSON technical error", () => {
      const jsonStr = '500 {"error": {"message": "PrismaClientKnownRequestError: Table not found"}}';
      const result = normalizeError(jsonStr);
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
      expect(result.message).not.toContain("PrismaClient");
      expect(result.message).not.toContain("Table not found");
    });

    it("preserves safe user message inside JSON", () => {
      const jsonStr = '400 {"error": "অনুগ্রহ করে শিরোনাম প্রদান করুন"}';
      const result = normalizeError(jsonStr);
      expect(result.message).toBe("অনুগ্রহ করে শিরোনাম প্রদান করুন");
    });
  });

  describe("Sensitive Detail Scrubbing", () => {
    it("scrubs Bearer tokens and passwords", () => {
      const input = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz and password: 'mySecretPassword123'";
      const scrubbed = scrubSensitiveDetails(input);
      expect(scrubbed).not.toContain("eyJhbGci");
      expect(scrubbed).not.toContain("mySecretPassword123");
      expect(scrubbed).toContain("Bearer [REDACTED]");
    });

    it("scrubs Windows and Linux file paths", () => {
      const input = "Error in C:\\Users\\digan\\project\\node_modules\\react\\index.js and /var/log/sys.log";
      const scrubbed = scrubSensitiveDetails(input);
      expect(scrubbed).not.toContain("C:\\Users");
      expect(scrubbed).not.toContain("/var/log");
    });
  });

  describe("Digest / Reference ID Preservation", () => {
    it("extracts Next.js digest as referenceId", () => {
      const err = Object.assign(new Error("Database crash"), { digest: "NEXT_DIGEST_12345" });
      const result = normalizeError(err);
      expect(result.referenceId).toBe("NEXT_DIGEST_12345");
      expect(result.message).toBe(SAFE_ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    });
  });
});
