import { createContext, useContext } from "react";

/** Mobile navigation drawer state, shared by the header's menu button and the layout. */
export const SidebarContext = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);
