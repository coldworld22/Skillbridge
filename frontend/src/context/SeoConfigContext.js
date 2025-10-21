import { createContext, useContext } from "react";

export const SeoConfigContext = createContext({
  settings: null,
  setSettings: () => {},
});

export const useSeoConfigContext = () => useContext(SeoConfigContext);
