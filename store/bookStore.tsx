import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { MMKV, Mode } from 'react-native-mmkv';

export const storage = new MMKV();

const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.delete(name);
  },
};

export type Category = 'Light Novel' | 'Web Novel' | 'Manga' | 'Comic' | 'Book';

export type Book = {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  language?: string;
  category?: string[];
  description?: string;
  path?: string; // Path for local files (if EPUB/PDF)
  volumes?: string; // Only for Light Novels (list of volume file paths)
  addedAt?: number;
  externalLink?: string; // Store external sources for the book
};

type BookStore = {
  books: Record<string, Book>;
  getBook: (id: string) => Book | undefined;
  getBookIds: () => string[];
  getBooks: () => Record<string, Book>;
  addBook: (book: Book) => void;
  addBooks: (books: Book[]) => void;
  updateBook: (id: string, data: Partial<Book>) => void;
  removeBook: (id: string) => void;
  debugClear: () => void;
};

export const useBookStore = create<BookStore & { hydrated: boolean }>()(
  persist(
    (set, get) => ({
      books: {},
      hydrated: false,

      getBook: (id) => get().books[id],
      getBookIds: () => Object.keys(get().books),
      getBooks: () => {
        return get().books;
      },

      addBook: (book) =>
        set((state) => {
          // console.log("Adding book:", book, book.id);
          if (state.books[book.id]) return state; // Prevent duplicates
          return {
            books: {
              ...state.books,
              [book.id]: {
                ...book,
                category: book.category ?? ['Book'], // Set default category if not provided
              },
            },
          };
        }),

      addBooks: (books: Book[]) =>
        set((state) => {
          // console.log('🚀 addBooks CALLED with:', books.length, 'books');

          const newBooks = { ...state.books };
          let addedCount = 0;
          books.forEach((book) => {
            if (!newBooks[book.id]) {
              newBooks[book.id] = {
                ...book,
                category: book.category ?? ['Book'],
              };
              addedCount++;
            } else {
              console.log("Book with ID '" + book.id + '' + 'already exists.');
            }
          });

          // console.log(`✅ ${addedCount} new books added`);
          // console.log('📚 Total books after update:', Object.keys(newBooks).length);

          return { books: newBooks };
        }),

      updateBook: (id, data) =>
        set((state) => ({
          books: { ...state.books, [id]: { ...state.books[id], ...data } },
        })),

      removeBook: (id) =>
        set((state) => {
          const newBooks = { ...state.books };
          delete newBooks[id];
          return { books: newBooks };
        }),
      debugClear: () => set({ books: {} }),
    }),
    {
      name: 'book-storage', // AsyncStorage key
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: (state) => {
        console.log('Hydrated books...');
        state.hydrated = true; // Mark hydration as complete
      },
    }
  )
);
