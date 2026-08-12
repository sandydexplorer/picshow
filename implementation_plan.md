# Implementation Plan — PicShow Improvements & Fixes

Comprehensive design and implementation plan for fixes, media library enhancements, pinch zoom, device folders, video support, and local build pipelines.

## Proposed Changes

### Core Hook & Media Engine
#### [MODIFY] [usePhotos.ts](file:///e:/Downloads/PicShow/src/hooks/usePhotos.ts)
- Query both `MediaType.photo` and `MediaType.video`.
- Order media strictly by `creationTime` descending (newest first).
- Fetch album covers and asset counts for device folders (Camera, Screenshots, WhatsApp Images, WhatsApp Video, Downloads).
- Increase query page size to 100 items.
- Provide `getAssetInfoAsync` fallback for individual asset lookups.

### Context & State Management
#### [MODIFY] [SafeShowContext.tsx](file:///e:/Downloads/PicShow/src/context/SafeShowContext.tsx)
- Store `safeShowPhotos: Photo[]` directly in context state.
- Update `activateSafeShow(photoIds, photos)` to pass full selected media items directly, avoiding async load freezes.

### Component Updates
#### [MODIFY] [PhotoThumbnail.tsx](file:///e:/Downloads/PicShow/src/components/PhotoThumbnail.tsx)
- Render video badge with play icon and formatted duration overlay for video items.

#### [MODIFY] [ZoomableImage.tsx](file:///e:/Downloads/PicShow/src/components/ZoomableImage.tsx)
- Re-architect PanResponder gesture handlers:
  - Retain exact pinched scale on gesture end (no snap-back to 1x).
  - Smooth pan boundaries across zoomed image.
  - Double-tap toggle between 1.0x and 2.5x.

#### [MODIFY] [PinPad.tsx](file:///e:/Downloads/PicShow/src/components/PinPad.tsx)
- Apply `useSafeAreaInsets()` to position `< Cancel` button dynamically below the Android status bar.

### Screen Updates
#### [MODIFY] [AlbumsScreen.tsx](file:///e:/Downloads/PicShow/src/screens/AlbumsScreen.tsx)
- Implement dual tab interface: "Device Folders" and "Safe Albums".
- Render device folders with cover image preview, folder title, and asset counts matching phone gallery layout.
- Tapping a device folder filters Gallery view directly.

#### [MODIFY] [SafeShowScreen.tsx](file:///e:/Downloads/PicShow/src/screens/SafeShowScreen.tsx)
- Read `safeShowPhotos` directly from `SafeShowContext` to render selected photos/videos instantly.

## Verification Plan
- `npx tsc --noEmit` verified with 0 errors.
- Verified pinch zoom, Safe Show instant load, device folder grid, video badges, and cancel button position.
