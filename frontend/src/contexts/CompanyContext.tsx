"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Company = {
  id: string;
  name: string;
  currency: string;
  category?: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
};

const DEFAULT_COMPANIES: Company[] = [
  {
    id: "comp-1",
    name: "BizTech Solutions SARL",
    currency: "CFA",
    category: "High-Tech & Électronique",
    role: "owner",
    createdAt: "2025-01-10",
  },
  {
    id: "comp-2",
    name: "Dakar Retail Distribution",
    currency: "CFA",
    category: "Commerce de détail",
    role: "admin",
    createdAt: "2025-02-15",
  },
  {
    id: "comp-3",
    name: "Lomé Agro & Négoce",
    currency: "CFA",
    category: "Agro-alimentaire",
    role: "owner",
    createdAt: "2025-03-01",
  },
];

const STORAGE_KEY_COMPANIES = "bizia_companies";
const STORAGE_KEY_ACTIVE = "bizia_active_company_id";

type CompanyContextValue = {
  companies: Company[];
  currentCompany: Company;
  switchCompany: (companyId: string) => void;
  createCompany: (name: string, category?: string) => Company;
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(DEFAULT_COMPANIES);
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(DEFAULT_COMPANIES[0].id);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Charger depuis le localStorage au montage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMPANIES);
      const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE);

      if (stored) {
        const parsed = JSON.parse(stored) as Company[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCompanies(parsed);
          if (activeId && parsed.some((c) => c.id === activeId)) {
            setCurrentCompanyId(activeId);
          } else {
            setCurrentCompanyId(parsed[0].id);
          }
          return;
        }
      }
      // Initialiser si vide
      localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(DEFAULT_COMPANIES));
      localStorage.setItem(STORAGE_KEY_ACTIVE, DEFAULT_COMPANIES[0].id);
    } catch {
      // Fallback gracieux
    }
  }, []);

  const switchCompany = useCallback((companyId: string) => {
    setCurrentCompanyId(companyId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ACTIVE, companyId);
    }
  }, []);

  const createCompany = useCallback(
    (name: string, category?: string) => {
      const newCompany: Company = {
        id: `comp-${Date.now()}`,
        name: name.trim(),
        currency: "CFA",
        category: category?.trim() || "Commerce Général",
        role: "owner",
        createdAt: new Date().toISOString().split("T")[0],
      };

      setCompanies((prev) => {
        const updated = [...prev, newCompany];
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(updated));
          localStorage.setItem(STORAGE_KEY_ACTIVE, newCompany.id);
        }
        return updated;
      });

      setCurrentCompanyId(newCompany.id);
      setIsCreateModalOpen(false);
      return newCompany;
    },
    []
  );

  const openCreateModal = useCallback(() => setIsCreateModalOpen(true), []);
  const closeCreateModal = useCallback(() => setIsCreateModalOpen(false), []);

  const currentCompany = useMemo(() => {
    return companies.find((c) => c.id === currentCompanyId) ?? companies[0] ?? DEFAULT_COMPANIES[0];
  }, [companies, currentCompanyId]);

  const value = useMemo(
    () => ({
      companies,
      currentCompany,
      switchCompany,
      createCompany,
      isCreateModalOpen,
      openCreateModal,
      closeCreateModal,
    }),
    [
      companies,
      currentCompany,
      switchCompany,
      createCompany,
      isCreateModalOpen,
      openCreateModal,
      closeCreateModal,
    ]
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error("useCompany doit être utilisé au sein d'un CompanyProvider.");
  }
  return ctx;
}
