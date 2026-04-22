"use client";

import { createContext, useContext, useMemo, useState } from "react";

/**
 * `null` = All activities.
 * Filter values that match `sessions.activity` in the DB; extra types are filtered client-side when RPC returns all.
 */
export type FeedActivityFilter =
  | null
  | "running"
  | "cycling"
  | "surfing"
  | "swimming"
  | "social"
  | "hiking"
  | "yoga"
  | "climbing"
  | "tennis";

type Ctx = {
  activeFilter: FeedActivityFilter;
  setActiveFilter: (f: FeedActivityFilter) => void;
};

const FeedFilterContext = createContext<Ctx | null>(null);

export function FeedFilterProvider({ children }: { children: React.ReactNode }) {
  const [activeFilter, setActiveFilter] = useState<FeedActivityFilter>(null);

  const value = useMemo(
    () => ({ activeFilter, setActiveFilter }),
    [activeFilter]
  );

  return (
    <FeedFilterContext.Provider value={value}>
      {children}
    </FeedFilterContext.Provider>
  );
}

export function useFeedFilter() {
  const c = useContext(FeedFilterContext);
  if (!c) {
    return {
      activeFilter: null as FeedActivityFilter,
      setActiveFilter: (() => {}) as (f: FeedActivityFilter) => void,
    };
  }
  return c;
}

export const FEED_FILTER_ITEMS: { label: string; value: FeedActivityFilter }[] =
  [
    { label: "All", value: null },
    { label: "Running", value: "running" },
    { label: "Cycling", value: "cycling" },
    { label: "Surfing", value: "surfing" },
    { label: "Swimming", value: "swimming" },
    { label: "Social", value: "social" },
    { label: "Hiking", value: "hiking" },
    { label: "Yoga", value: "yoga" },
    { label: "Climbing", value: "climbing" },
    { label: "Tennis", value: "tennis" },
  ];
