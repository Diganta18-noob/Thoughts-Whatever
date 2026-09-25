import { findActiveCueIndex, findActiveWordIndex, formatTimecode, Cue } from "../reference/audio/types";
import { generateVtt } from "../reference/audio/vtt";

describe("Reference Audio System Tests", () => {
  const mockCues: Cue[] = [
    {
      id: 0,
      start: 0,
      end: 5.5,
      text: "প্রথম বাক্য।",
      words: [
        { text: "প্রথম", start: 0 },
        { text: "বাক্য।", start: 2.5 },
      ],
      confidence: 0.95,
    },
    {
      id: 1,
      start: 5.5,
      end: 12.0,
      text: "দ্বিতীয় বাক্য যাতে একাধিক শব্দ রয়েছে।",
      words: [
        { text: "দ্বিতীয়", start: 5.5 },
        { text: "বাক্য", start: 7.0 },
        { text: "যাতে", start: 8.5 },
        { text: "রয়েছে।", start: 10.0 },
      ],
      confidence: 0.95,
    },
    {
      id: 2,
      start: 12.0,
      end: 20.0,
      text: "তৃতীয় বাক্য সমাপ্তি।",
      words: [
        { text: "তৃতীয়", start: 12.0 },
        { text: "বাক্য", start: 14.5 },
        { text: "সমাপ্তি।", start: 17.0 },
      ],
      confidence: 0.95,
    },
  ];

  test("binary search findActiveCueIndex returns correct cue at various times", () => {
    expect(findActiveCueIndex(mockCues, -1)).toBe(-1);
    expect(findActiveCueIndex(mockCues, 0)).toBe(0);
    expect(findActiveCueIndex(mockCues, 3.2)).toBe(0);
    expect(findActiveCueIndex(mockCues, 5.4)).toBe(0);
    expect(findActiveCueIndex(mockCues, 5.5)).toBe(1);
    expect(findActiveCueIndex(mockCues, 5.6)).toBe(1);
    expect(findActiveCueIndex(mockCues, 11.9)).toBe(1);
    expect(findActiveCueIndex(mockCues, 12.0)).toBe(2);
    expect(findActiveCueIndex(mockCues, 15.0)).toBe(2);
    expect(findActiveCueIndex(mockCues, 25.0)).toBe(2);
  });

  test("findActiveWordIndex locates active word inside cue", () => {
    const cue = mockCues[1];
    expect(findActiveWordIndex(cue, 5.5)).toBe(0);
    expect(findActiveWordIndex(cue, 7.5)).toBe(1);
    expect(findActiveWordIndex(cue, 9.0)).toBe(2);
    expect(findActiveWordIndex(cue, 11.0)).toBe(3);
  });

  test("formatTimecode formats minutes, seconds, and hours properly", () => {
    expect(formatTimecode(0)).toBe("00:00");
    expect(formatTimecode(65)).toBe("01:05");
    expect(formatTimecode(1765)).toBe("29:25");
    expect(formatTimecode(3665)).toBe("1:01:05");
  });

  test("generateVtt outputs valid WebVTT format", () => {
    const vtt = generateVtt(mockCues);
    expect(vtt).toContain("WEBVTT");
    expect(vtt).toContain("00:00:00.000 --> 00:00:05.500");
    expect(vtt).toContain("প্রথম বাক্য।");
    expect(vtt).toContain("00:00:05.500 --> 00:00:12.000");
  });
});
