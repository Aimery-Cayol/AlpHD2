import React from "react";
import { useParamsStore } from "@/store/params-store";

export default function MyLevaUI({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

// Hook utilisé par tous les composants de scène
export function useSceneControls() {
  return useParamsStore();
}
