"use client";

import React, { createContext, ReactNode, useContext, useState } from "react";

interface BreadcrumbContextType {
  customTitle: string | null;
  setCustomTitle: (title: string | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined,
);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [customTitle, setCustomTitle] = useState<string | null>(null);

  return (
    <BreadcrumbContext.Provider value={{ customTitle, setCustomTitle }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);

  if (context === undefined) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }

  return context;
}
