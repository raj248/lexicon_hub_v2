import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";


type PreferencesStore = {
  theme: "light" | "dark" | "system";
  fontSize: number;
  lineSpacing: "compact" | "normal" | "spacious";
  orientation: "auto" | "portrait" | "landscape";
  margin: number;

  setTheme: (theme: PreferencesStore["theme"]) => void;
  setFontSize: (size: number) => void;
  setMargin: (margin: number) => void;
  setLineSpacing: (spacing: PreferencesStore["lineSpacing"]) => void;
  setOrientation: (orientation: PreferencesStore["orientation"]) => void;
};


export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      theme: "system",
      fontSize: 36,
      margin: 16,
      lineSpacing: "normal",
      orientation: "auto",

      setTheme: (theme) => set({ theme }),
      setFontSize: (size) => set({ fontSize: size }),
      setMargin: (margin) => set({ margin }),
      setLineSpacing: (spacing) => set({ lineSpacing: spacing }),
      setOrientation: (orientation) => set({ orientation }),
    }),
    {
      name: "preferences-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
