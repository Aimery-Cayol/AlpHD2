"use client";

import React, { createContext, useContext, useRef, useCallback, useMemo, useState } from "react";
import { Mesh } from "three";

interface ColliderContextValue {
  collidersRef: React.MutableRefObject<Mesh[]>;
  addCollider: (mesh: Mesh) => void;
  removeCollider: (mesh: Mesh) => void;
  version: number;
}

const ColliderContext = createContext<ColliderContextValue | null>(null);

export function ColliderProvider({ children }: { children: React.ReactNode }) {
  const collidersRef = useRef<Mesh[]>([]);
  const [version, setVersion] = useState(0);

  const addCollider = useCallback((mesh: Mesh) => {
    if (!collidersRef.current.includes(mesh)) {
      collidersRef.current = [...collidersRef.current, mesh];
      setVersion(v => v + 1);
    }
  }, []);

  const removeCollider = useCallback((mesh: Mesh) => {
    const index = collidersRef.current.indexOf(mesh);
    if (index !== -1) {
      collidersRef.current = collidersRef.current.filter(m => m !== mesh);
      setVersion(v => v + 1);
    }
  }, []);

  const value = useMemo(() => ({
    collidersRef,
    addCollider,
    removeCollider,
    version,
  }), [addCollider, removeCollider, version]);

  return (
    <ColliderContext.Provider value={value}>
      {children}
    </ColliderContext.Provider>
  );
}

export function useColliders() {
  const context = useContext(ColliderContext);
  if (!context) {
    throw new Error("useColliders must be used within a ColliderProvider");
  }
  return context;
}
