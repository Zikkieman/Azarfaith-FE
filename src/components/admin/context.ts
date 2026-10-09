import { createContext, useContext } from "react";

/** Mobile navigation drawer state, shared by the header's menu button and the layout. */
export const SidebarContext = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

/** The ⌘K command palette, opened from the sidebar, the keyboard or empty states. */
export const PaletteContext = createContext<{
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
}>({ paletteOpen: false, setPaletteOpen: () => {} });

export const usePalette = () => useContext(PaletteContext);
