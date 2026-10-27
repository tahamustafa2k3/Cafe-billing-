import { useEffect, useState } from "react";
import { useBillingStore } from "@/lib/billing-store";

export function useStoreReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (useBillingStore.persist.hasHydrated()) {
      setReady(true);
      return;
    }
    return useBillingStore.persist.onFinishHydration(() => setReady(true));
  }, []);

  return ready;
}
