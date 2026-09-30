# Scrolling

Public pages use native browser scrolling. CSS smooth scrolling is limited to programmatic/anchor navigation and disabled when reduced motion is requested. Article reading progress updates its visual bar on animation frames, while React state and saved progress update only when the whole percentage changes.

To investigate regressions, record a long article scroll in Chrome Performance and inspect long tasks, scripting time, and frame rate. The BetterBugs report alone does not include frame timing.
