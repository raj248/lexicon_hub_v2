# Lexicon Hub - TODO

## App Navigation

- [ ] Long Press on book, sticky header/ context menu
- - [ ] Add a "Continue Reading" section on the main library screen
        Persistent navigation state (reopen last screen)
        Smooth transition animations between screens
        Delete book from device (with confirmation)
        Handle file renames or missing files gracefully
        PDF support (planned)

Use Kotlin native module for PDF parsing/rendering

Text reflow toggle
Search within EPUB text
Page count estimation (Kotlin-based)
Smooth animations for header/footer visibility
Scroll position indicator / progress bar
Page number indicator (x of y)
Keep screen awake while reading
Haptic feedback for chapter change or tap zones
Search/filter chapters
Sticky current chapter header
Chapter progress bar (visual)

## 1. Book Progress

- [ ] Save reading progress per book
  - Store: `bookId`, `progress`, `deviceId`
  - Update on page/scroll change
- [ ] Implement bookmarks
  - Store: `bookId`, `progress`, `deviceId`
  - Allow multiple bookmarks per book
  - Show bookmarks in UI

## 2. Settings

- [ ] Create settings modal or dropdown
  - Font size adjustment
  - Theme selection (light/dark/sepia)
  - Line height adjustment
  - Brightness adjustment
  - Text alignment (left, right, justify)
  - Document flow options:
    - Auto
    - Paged
    - Scrolled
- [ ] Change fonts dynamically
  - Support custom fonts
  - Apply to currently open book

## 3. Reader UI

- [ ] Integrate Gestures in WebView (done)
- [ ] Show/hide header and navigation on tap (done)
- [ ] Smooth animation when hiding/showing header
- [ ] Ensure tap gestures don’t interfere with reading

## 4. Reader Logic

- [ ] SVG Image support (done)
- [ ] CBZ Support
- [ ] PDF Support
- [ ] Open as support (open zip as cbz or epub)

## 5. Chapter Navigation

- [ ] Custom drawer for listing chapters (done)
- [ ] Scrollable chapter list (done)
- [ ] Option to collapse/expand drawer (done)
- [ ] Handle large books efficiently (5000+ chapters) (done)
- [ ] Highlight current chapter (done)
- [ ] Tap to navigate to chapter (done)
- [ ] Customize ViewHolder (done)
- [ ] Add customization settings: Modal Chapter List
- [ ] Scroll to saved chapter

## 6. Image Viewer

- [ ] Implement a custom image viewer for full-screen image display
- [ ] Add zoom and pan functionality to the image viewer
- [ ] Ensure smooth transitions when opening and closing the image viewer

## 6. Optional / Future Enhancements

- [ ] Cloud backup of progress & bookmarks (Google Drive, GitHub)
- [ ] Text-to-speech integration
- [ ] Search within book chapters
- [ ] Annotation/highlight support
- [ ] Reading stats (time spent, progress %)
- [ ] CBZ Support
