# Lexicon Hub - TODO

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

## 6. Optional / Future Enhancements

- [ ] Cloud backup of progress & bookmarks (Google Drive, GitHub)
- [ ] Search within book chapters
- [ ] Annotation/highlight support
- [ ] Reading stats (time spent, progress %)
- [ ] CBZ Support
