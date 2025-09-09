## File Structure

```
/app
  /(tabs)              # Tabs navigation
    library/           # Library screens
      index.tsx        # main bookshelf
      [bookId].tsx     # book details
      [bookId]/reader.tsx
      [bookId]/chapters.tsx
    progress/          # reading progress
      index.tsx
      [bookId].tsx
    sync/              # cloud sync
      index.tsx
      github.tsx
      google.tsx
    settings/          # app settings
      index.tsx
      appearance.tsx
      reading.tsx
      advanced.tsx
```
