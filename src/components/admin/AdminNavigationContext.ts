import { createContext, useContext } from "react";

export const AdminNavigationContext = createContext<{
  open: boolean;
  setOpen: (value: boolean) => void;
}>({ open: false, setOpen: () => {} });

export const useSidebar = () => useContext(AdminNavigationContext);

export const PaletteContext = createContext<{
  paletteOpen: boolean;
  setPaletteOpen: (value: boolean) => void;
}>({ paletteOpen: false, setPaletteOpen: () => {} });
export const usePalette = () => useContext(PaletteContext);
