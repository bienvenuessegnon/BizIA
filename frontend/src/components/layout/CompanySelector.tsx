"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconCheckCircle, IconX } from "@/components/icons/Icons";

export function CompanySelector() {
  const {
    companies,
    currentCompany,
    switchCompany,
    createCompany,
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
  } = useCompany();
  const { success, error: toastError } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form states for new company
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCategory, setNewCompanyCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(companyId: string) {
    switchCompany(companyId);
    setIsOpen(false);
    const selected = companies.find((c) => c.id === companyId);
    if (selected) {
      success(`Entreprise active : ${selected.name}`);
    }
  }

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await createCompany(newCompanyName, newCompanyCategory);
      setNewCompanyName("");
      setNewCompanyCategory("");
      success(`Entreprise "${created.name}" créée avec succès !`);
    } catch {
      toastError("Erreur lors de la création de l'entreprise.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentCompany) return null;

  return (
    <>
      <div className="company-selector" ref={dropdownRef}>
        <button
          type="button"
          className={`company-selector__trigger ${isOpen ? "company-selector__trigger--open" : ""}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="true"
          aria-expanded={isOpen}
          title="Changer d'entreprise"
        >
          <span className="company-selector__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
              <path d="M9 22v-4h6v4" />
              <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
              <path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" />
              <path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
            </svg>
          </span>
          <div className="company-selector__info">
            <span className="company-selector__name">{currentCompany.name}</span>
            <span className="company-selector__badge">{currentCompany.category || "Entreprise"}</span>
          </div>
          <span className="company-selector__arrow" aria-hidden="true">
            ▾
          </span>
        </button>

        {isOpen && (
          <div className="company-selector__dropdown animate-fade-in" role="menu">
            <div className="company-selector__header">
              <span>Mes Entreprises</span>
              <span className="muted">{companies.length} active(s)</span>
            </div>

            <div className="company-selector__list">
              {companies.map((comp) => {
                const isActive = comp.id === currentCompany.id;
                return (
                  <button
                    key={comp.id}
                    type="button"
                    className={`company-selector__item ${isActive ? "company-selector__item--active" : ""}`}
                    onClick={() => handleSelect(comp.id)}
                    role="menuitem"
                  >
                    <div className="company-selector__item-content">
                      <strong className="company-selector__item-title">{comp.name}</strong>
                      <span className="company-selector__item-meta">
                        {comp.currency} {comp.category ? `· ${comp.category}` : ""}
                      </span>
                    </div>
                    {isActive && (
                      <span className="company-selector__check" aria-label="Entreprise active">
                        <IconCheckCircle size={14} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="company-selector__footer">
              <button
                type="button"
                className="company-selector__add-btn"
                onClick={() => {
                  setIsOpen(false);
                  openCreateModal();
                }}
              >
                + Créer une nouvelle entreprise
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal création d'entreprise */}
      {isCreateModalOpen && (
        <div className="modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
          <div className="modal-card card card--glass animate-scale-up">
            <div className="modal-header">
              <h2>Nouvelle entreprise</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeCreateModal}
                aria-label="Fermer"
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-form">
              <Input
                name="company_name"
                label="Nom de l'entreprise"
                placeholder="Ex: Distribution & Commerce SARL"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                required
              />

              <Input
                name="company_category"
                label="Secteur d'activité"
                placeholder="Ex: Électronique, Alimentation, Cosmétique…"
                value={newCompanyCategory}
                onChange={(e) => setNewCompanyCategory(e.target.value)}
              />

              <div className="modal-actions">
                <Button type="button" variant="secondary" onClick={closeCreateModal}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={!newCompanyName.trim() || isSubmitting}
                  loading={isSubmitting}
                >
                  Enregistrer et basculer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
