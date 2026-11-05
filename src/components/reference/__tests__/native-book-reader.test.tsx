/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { NativeBookReader } from "../reader/native-book-reader";

jest.mock("../reference-activity-tracker", () => ({
  ReferenceActivityTracker: () => null,
}));

it("shows the last scanned page until the reader chooses to finish", () => {
  render(
    <NativeBookReader
      work={{ id: "book", slug: "book", titleBn: "Test Book", language: "ENGLISH" }}
      edition={{ id: "edition", hostingMode: "THOUGHTS_WHATEVER", rightsStatus: "PUBLIC_DOMAIN" }}
      source={null}
      pages={[
        { pageNumber: 1, imageUrl: "/page-1.jpg", width: 600, height: 800 },
        { pageNumber: 2, imageUrl: "/page-2.jpg", width: 600, height: 800 },
      ]}
      initialPage={2}
      isRightsVerified
      canDownload={false}
    />,
  );

  expect(screen.getByRole("img", { name: "Test Book — Page 2" })).toBeVisible();
  const finish = screen.getByRole("button", { name: "Finish reading" });
  expect(fireEvent.keyDown(finish, { key: " " })).toBe(true);
  fireEvent.click(finish);
  expect(screen.getByText("Book Complete")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Return to First Page" }));
  expect(screen.getByRole("img", { name: "Test Book — Page 1" })).toBeVisible();
});
