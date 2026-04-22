"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Session } from "@/types";

type Ctx = {
  postModalOpen: boolean;
  setPostModalOpen: (open: boolean) => void;
  editingSession: Session | null;
  setEditingSession: (s: Session | null) => void;
  openPostModalForCreate: () => void;
  openPostModalForEdit: (session: Session) => void;
  postedVersion: number;
  notifySessionPosted: () => void;
};

const PostSessionContext = createContext<Ctx | null>(null);

export function PostSessionProvider({ children }: { children: React.ReactNode }) {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [postedVersion, setPostedVersion] = useState(0);

  const notifySessionPosted = useCallback(
    () => setPostedVersion((n) => n + 1),
    []
  );

  const openPostModalForCreate = useCallback(() => {
    setEditingSession(null);
    setPostModalOpen(true);
  }, []);

  const openPostModalForEdit = useCallback((session: Session) => {
    setEditingSession(session);
    setPostModalOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      postModalOpen,
      setPostModalOpen,
      editingSession,
      setEditingSession,
      openPostModalForCreate,
      openPostModalForEdit,
      postedVersion,
      notifySessionPosted,
    }),
    [
      postModalOpen,
      editingSession,
      openPostModalForCreate,
      openPostModalForEdit,
      postedVersion,
      notifySessionPosted,
    ]
  );

  return (
    <PostSessionContext.Provider value={value}>
      {children}
    </PostSessionContext.Provider>
  );
}

export function usePostSession() {
  const c = useContext(PostSessionContext);
  if (!c) {
    return {
      postModalOpen: false,
      setPostModalOpen: () => {},
      editingSession: null as Session | null,
      setEditingSession: () => {},
      openPostModalForCreate: () => {},
      openPostModalForEdit: () => {},
      postedVersion: 0,
      notifySessionPosted: () => {},
    };
  }
  return c;
}
