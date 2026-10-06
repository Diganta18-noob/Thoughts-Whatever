/** @jest-environment jsdom */
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { __loaded: false, init: jest.fn(), capture: jest.fn(), reset: jest.fn(), opt_in_capturing: jest.fn(), opt_out_capturing: jest.fn() },
}));

import sdk from "posthog-js";
import { initPostHog, posthog } from "@/lib/posthog-client";
import { saveConsent } from "@/lib/analytics-consent";

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  sdk.__loaded = false;
  process.env.NEXT_PUBLIC_POSTHOG_KEY = "public-test-project-id";
});

afterEach(() => { delete process.env.NEXT_PUBLIC_POSTHOG_KEY; });

it("does not initialize or queue PostHog events before acceptance", () => {
  initPostHog();
  posthog.capture("article_opened");
  expect(sdk.init).not.toHaveBeenCalled();
  expect(sdk.capture).not.toHaveBeenCalled();
});

it("disables recording and strips query strings and search text", () => {
  saveConsent("accepted");
  initPostHog();
  const options = (sdk.init as jest.Mock).mock.calls[0][1];
  expect(options).toMatchObject({ persistence: "memory", disable_session_recording: true, autocapture: false });
  const event = options.before_send({ properties: { $current_url: "https://example.com/search?q=private", $referrer: "https://example.com/?token=private", query: "private" } });
  expect(event.properties).toEqual({ $current_url: "https://example.com/search", $referrer: "https://example.com/" });
  saveConsent("rejected");
  expect(options.before_send(event)).toBeNull();
});

it("stops capture and resets SDK state on withdrawal", () => {
  saveConsent("rejected");
  sdk.__loaded = true;
  initPostHog();
  posthog.capture("article_opened");
  expect(sdk.opt_out_capturing).toHaveBeenCalled();
  expect(sdk.reset).toHaveBeenCalled();
  expect(sdk.capture).not.toHaveBeenCalled();
});
