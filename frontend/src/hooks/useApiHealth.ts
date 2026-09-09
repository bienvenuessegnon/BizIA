/** État de connexion à l'API — utile pour le debug d'intégration. */

"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";

export function useApiHealth() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .health()
      .then(() => setOk(true))
      .catch(() => setOk(false));
  }, []);

  return ok;
}
