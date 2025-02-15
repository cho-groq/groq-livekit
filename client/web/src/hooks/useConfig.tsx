"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useCallback, useState } from "react";
import { useEffect } from "react";

export type Config = {
  ci_api_key?: string;
};

const ConfigContext = createContext<Config | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  let config: Config = {};

  if (typeof window !== "undefined" && !!window.location.hash) {
    const params = new URLSearchParams(window.location.hash.replace("#", ""));
    const ci_api_key = params.get("ci_api_key");

    if (ci_api_key !== null && !!history) {
      history.replaceState(
        null,
        "",
        `${window.location.pathname + window.location.search}`
      );

      config.ci_api_key = ci_api_key;
    }
  }

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = React.useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
