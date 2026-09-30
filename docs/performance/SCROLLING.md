# Scrolling

Public pages use Lenis for gentle wheel smoothing (lerp 0.12), with native touch scrolling. The provider is recreated on route changes and destroyed on cleanup. Reduced-motion changes disable it immediately. Admin, dedicated book-reader and listening routes retain native scrolling.

Nested scroll areas, textareas, dialogs and body scroll locks bypass smoothing. Anchor links use an 88px header offset; native anchors use CSS scroll padding. Lenis CSS disables competing browser smooth behavior while active.

Article progress continues to update on animation frames. Verify desktop wheel, touch, keyboard, anchor navigation, browser back, dialog scrolling and reduced motion before production release. Record a long article in Chrome Performance to inspect scripting time and frame rate.

## 2026-09-30 verification
Production build completed successfully (147 generated pages). The lifecycle test suite verifies immediate reduced-motion cleanup, admin/book/listening exclusions, route cleanup and initial reduced-motion preference (5 tests). Browser checks confirmed rendered content, Lenis initialization, collection anchor navigation and no measured horizontal overflow in checked views. Detailed frame-rate profiling and physical touch-device verification were not performed.
