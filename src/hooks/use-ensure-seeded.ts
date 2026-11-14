import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect } from "react";

/**
 * Seeds the sample operation once per deployment. The mutation is idempotent, so
 * every protected screen can call it without racing another screen's seed.
 */
export function useEnsureSeeded() {
  const ensureSeeded = useMutation(api.seed.ensureSeeded);

  useEffect(() => {
    ensureSeeded().catch((error) => {
      console.error("Could not seed the sample operation", error);
    });
  }, [ensureSeeded]);
}
