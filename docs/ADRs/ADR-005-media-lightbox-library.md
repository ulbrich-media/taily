# ADR-005: Media Lightbox Library

## Status

Accepted

## Context

The `PictureGallery` component shows animal media (images and videos) as small thumbnails in a drag-and-drop sortable grid. Users need a way to preview individual media items at full size. A lightbox — an overlay that shows the selected item full-screen with the ability to swipe between items — is the standard UX pattern for this.

Requirements for the lightbox:
- Full-frame preview of both images and videos with browser-native controls
- Full keyboard and screen-reader accessibility
- Swipe-to-navigate for touch/mobile users
- Download button support
- Enough customisation to match the existing UI
- Works well on mobile

An additional constraint: the same thumbnail tiles are used for drag-and-drop reordering (via `@dnd-kit`). The lightbox must coexist with the drag sensor without accidental opens during a drag operation.

## Decision

Use **`yet-another-react-lightbox`** (YARL) with its `Video` and `Download` plugins.

To prevent lightbox opens during drag, the `PointerSensor` is configured with `activationConstraint: { distance: 5 }`. A pointer movement of less than 5 px is treated as a tap/click and opens the lightbox; more than 5 px activates the drag and suppresses the click event.

## Consequences

### Positive

- All requirements met out of the box (accessibility, swipe, video, download plugin).
- MIT license — no commercial restrictions.
- Small footprint: 1 additional npm package with no transitive dependencies.
- Plugin architecture (Video, Download, Thumbnails, Zoom, …) makes future enhancements straightforward.
- CSS custom-property theming allows visual alignment with the app's design tokens if needed.

## Alternatives Considered

**`lightgallery`** — full-featured with native React component and native video support, but requires a commercial license for non-GPL projects.

**`@fancyapps/ui` (Fancybox)** — framework-agnostic, TypeScript-first, actively maintained, but also GPL/commercial licensing.

**`react-photoswipe-gallery`** — thin wrapper around PhotoSwipe 5, MIT licensed, good mobile support, but video requires an additional plugin and the React wrapper has a smaller community footprint.

**`fslightbox-react`** — lightweight, supports images and videos, free tier available, but no download button and limited customisation surface.

**Custom implementation with shadcn `Dialog`** — would reuse existing Radix UI primitives but requires non-trivial hand-rolled swipe detection, keyboard navigation, and video playback management. The accessibility and mobile polish would be hard to match a dedicated library's level for the effort involved.
