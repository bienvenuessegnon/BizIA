# AGY.md — Mémoire Centrale et Base de Connaissances BizIA

> **Statut du document** : Document de référence vivant. Ce fichier sert de mémoire persistante pour le projet BizIA. Il consolide l'ensemble du contexte V1, les spécifications détaillées de la V2, la répartition des tâches, l'architecture cible et le suivi des évolutions.

---

## 1. Vision et Principes Fondamentaux

* **Nom du projet** : BizIA
* **Tagline** : *Your data. Your intelligence. Your next decision.*
* **Mission** : Analyste de données autonome et copilote décisionnel pour les PME. Combler le fossé entre les données brutes dispersées (ventes, stocks, dépenses, classeurs Excel, reçus, factures PDF ou manuscrites) et les décisions concrètes du quotidien d'un chef d'entreprise.
* **Principe Fondateur (Règle d'or)** : **Un pipeline d'analyse unique**.
  * Qu'une donnée soit saisie à la main dans un formulaire ou importée (CSV, Excel, PDF tableau, photo/scan via OCR), elle est obligatoirement traduite vers un **schéma canonique commun** avant tout traitement.
  * Il n'y a **aucune divergence de logique métier** selon la source de données.
* **Chaîne de valeur** : Compréhension → Normalisation → Analyse/ML → Détection (anomalies/stocks) → Recommandation → Décision.
* **Philosophie IA (AI-first mais maîtrisée)** : L'IA (Gemini) sert à interpréter, structurer, transcrire et expliquer en langage naturel. Les calculs financiers et arithmétiques critiques restent déterministes (Python / Pandas / NumPy) pour garantir l'absence d'hallucinations chiffrées.

---

## 2. Synthèse de la V1 (État Actuel du Dépôt sur `dev`)

### Architecture technique V1
* **Frontend** : Next.js 15 (App Router), React 19, TypeScript. Design system moderne en pur CSS (`globals.css`), sans dépendance CSS lourde.
* **Backend** : FastAPI, Python 3.12, Pydantic v2.
* **ML / Analyse** : Package Python interne `ml/` (Pandas, NumPy, Scikit-learn), importé directement par le backend (`ml.pipeline.analyze`).
* **Stockage V1** : `JsonStore` dans `data/local/` (avec isolation par sous-dossier `users/{user_id}.json`).
* **Extraction & Ingestion V1** :
  * CSV (`pandas` sniffer dialectes, encodages UTF-8-sig).
  * Excel (`openpyxl`).
  * PDF tabulaire (`pdfplumber`).
  * PDF scan / Images : `pypdfium2` pour le rendu, `rapidocr-onnxruntime` pour l'OCR local.
  * Extraction multimodale intelligente : `extract_document_with_gemini` pour extraire des factures et tickets vers le schéma commun.
  * Workflow d'ingestion sécurisé en 2 étapes : `POST /api/ingestion/preview` (relecture/correction) puis `POST /api/ingestion/commit`.
* **Assistant IA V1** :
  * `POST /api/chat/messages` ancré à 100 % sur la dernière analyse calculée.
  * Mode Gemini avec prompt sous contraintes strictes.
  * Mode fallback déterministe par détection d'intentions si Gemini est absent.
* **Rapports V1** :
  * Génération serveur de PDF haute fidélité via ReportLab (`reportlab`) avec diagrammes vectoriels, KPI, classements et pagination.
  * Export Word via `python-docx`.
* **Déploiement** :
  * `Dockerfile` multi-stage servant le front Next.js compilé (`out/`) et l'API FastAPI sur un seul conteneur et un seul port (`8000`), sans soucis CORS.
  * Configuration Render (`render.yaml`) et Docker Compose (`docker-compose.yml`).

---

## 3. Spécifications Détaillées de la V2 (Issu des Livrables Équipe)

La V2 transforme le MVP en une **véritable solution SaaS complète, sécurisée, responsive, multi-entreprises et professionnelle**.

### 3.1. Comptes, Inscription et Authentification
* Vraie gestion des comptes utilisateurs avec persistance sécurisée.
* Inscription et connexion par e-mail / mot de passe.
* Flux de récupération de compte en cas d'oubli de mot de passe.
* Connexion sociale avec Google / Gmail (OAuth).
* Protection stricte des routes privées (`AuthGuard`) : redirection obligatoire vers la connexion/inscription si non authentifié.
* États d'interface clairs : chargement, erreur, succès, session expirée, déconnexion.

### 3.2. Base de Données avec Supabase
* Remplacement du stockage JSON de transition par **Supabase (PostgreSQL)**.
* Tables à stocker :
  * Profils / Utilisateurs (`profiles` / `auth.users`)
  * Entreprises (`companies` / `organizations`)
  * Membres / Permissions (`company_members` : owner, admin, member)
  * Produits et stocks (`products`)
  * Ventes (`sales`)
  * Analyses, alertes et recommandations (`analyses`, `alerts`, `recommendations`)
* Persistance garantie : aucune perte de données au rechargement ou à la reconnexion.
* Structure relationnelle propre, scalable et indexée.

### 3.3. Multi-Entreprises par Compte
* Un utilisateur unique peut créer et administrer plusieurs entreprises.
* Isolation stricte : chaque entreprise possède son propre catalogue de produits, ses ventes, ses stocks, ses alertes et ses analyses.
* Sélecteur d'entreprise actif : toute action dans l'application travaille exclusivement sur les données de l'entreprise courante.
* Aucune fuite ni mélange de données entre entreprises.

### 3.4. Confidentialité et Sécurité Avancée
* Row Level Security (RLS) PostgreSQL obligatoire sur toutes les tables de Supabase.
* Validation systématique des droits côté serveur (ne jamais se fier au client).
* Données sensibles masquées pour le frontend.
* Clés d'API IA (Gemini, Supabase Service Role) strictement confinées au backend.
* **Consigne explicite de sécurité** : Le simple hachage SHA-256 ne garantit pas la confidentialité. La sécurité doit reposer sur l'authentification forte, l'isolation RLS, les permissions et le principe de moindre privilège.

### 3.5. Import et Structuration Intelligente
* Formats supportés : CSV, Excel, PDF, Images/photos de reçus/tableaux.
* Données déjà tabulaires : nettoyage et normalisation directe.
* Données non structurées : extraction intelligente via IA/ML (Gemini / OCR) vers le format canonique.
* Écran d'aperçu et de validation/correction par l'utilisateur avant validation finale dans l'analyse.
* Normalisation standardisée : SKU, nom, catégorie, coûts d'achat, prix de vente, stocks, dates, quantités, canaux.

### 3.6. Fonctionnalités IA & Gemini Maîtrisées
* Backend unique pour les requêtes Gemini.
* Fonctions IA :
  1. Extraction et structuration de documents non standards.
  2. Interprétation des indicateurs et rédaction d'insights décisionnels.
  3. Assistant conversationnel ancré sur l'entreprise active.
  4. Génération de recommandations d'action concrètes.
* Interdiction formelle de confier des calculs comptables ou arithmétiques bruts au LLM.

### 3.7. Assistant IA Contextuel
* Réponses ancrées exclusivement sur l'entreprise sélectionnée et la dernière analyse.
* Capacité à répondre sur le CA, le bénéfice, la marge, les anomalies de vente, les ruptures de stock imminentes, et les explications de baisses de rentabilité.
* Vulgarisation claire et accessible pour les dirigeants sans bagage financier.

### 3.8. Alertes de Stock et Recommandations
* Seuils d'alerte configurables globalement et par produit.
* Alertes visuelles instantanées sur le dashboard dès l'approche d'une rupture.
* Recommandations classées par niveau d'urgence (`high`, `medium`, `low`).

### 3.9. Graphiques et Dashboard Professionnel
* Refonte visuelle du dashboard : hiérarchie des KPI (CA, Bénéfice, Marge %, Volume, Nombre de ventes).
* Graphiques modernes, lisibles, responsive et adaptés (courbes mensuelles, histogrammes de rentabilité, top ventes).
* Gestion soignée des états : chargement (skeletons/spinners), états vides explicatifs et bannières d'erreur.

### 3.10. Rapports et Documents Finaux
* Rapport exécutif PDF professionnel conforme à la charte BizIA.
* Synthèse claire des KPI, graphiques, alertes, anomalies et conseils opérationnels.
* Document directement prêt à être présenté à un banquier, investisseur ou associé.

### 3.11. Expérience Utilisateur & Responsive
* Design responsive complet : desktop, tablette et mobile.
* Cohérence visuelle stricte : typographies, boutons, cartes, modales, formulaires.
* Système de toasts et de modales pour confirmations, succès et erreurs explicites (aucune erreur silencieuse).

---

## 4. Parcours Utilisateur Cible (Démo Finale V2)

$$\begin{aligned}
\text{Inscription / Connexion} &\longrightarrow \text{Création / Sélection d'une Entreprise} \\
&\longrightarrow \text{Ajout manuel / Import de données (CSV/Excel/PDF/Image)} \\
&\longrightarrow \text{Structuration & Validation du tableau} \\
&\longrightarrow \text{Lancement de l'Analyse (Pipeline Commun)} \\
&\longrightarrow \text{Dashboard (KPIs & Graphiques)} \\
&\longrightarrow \text{Alertes de Stock & Détection d'Anomalies} \\
&\longrightarrow \text{Recommandations Directes} \\
&\longrightarrow \text{Dialogue avec l'Assistant IA Ancré} \\
&\longrightarrow \text{Génération du Rapport d'Analyse Final (PDF)}
\end{aligned}$$

---

## 5. Organisation de l'Équipe et Répartition des Tâches V2

### 1. Imma — Frontend & UX
* Refonte et uniformisation visuelle de l'interface BizIA.
* Écrans d'authentification : Inscription, Connexion, Mot de passe oublié, Bouton Google OAuth.
* Composant gardien des routes (`AuthGuard`).
* Composants de sélection, création et changement d'entreprise (`CompanySelector`).
* Amélioration des formulaires de saisie (produits, ventes) et des zones de dépôt de fichiers.
* Tableau d'aperçu et d'édition des données extraites avant intégration.
* Dashboard complet : KPI cards, graphiques adaptés, top ventes, rentabilité, alertes de stock.
* Interface de chat contextualisée avec l'entreprise active.
* Système de notifications (Toasts) et modales de confirmation/erreur.
* Responsive design (desktop, tablette, mobile).
* Préparation de la démonstration de l'interface utilisateur.

### 2. Uriel — Backend, API & Supabase
* Audit du backend existant et conservation des briques éprouvées.
* Configuration et structuration du projet **Supabase** (Auth et base PostgreSQL).
* Gestion des utilisateurs, sessions, récupération de mot de passe et OAuth Google avec Supabase Auth.
* Conception du schéma de base de données relationnel : `profiles`, `companies`, `company_members`, `products`, `sales`, `analyses`.
* Implémentation du multi-entreprises et des politiques **Row Level Security (RLS)** pour étanchéifier les données.
* Création et mise à jour des endpoints FastAPI :
  * Auth & profil
  * Gestion des entreprises (CRUD, sélection)
  * Produits & Ventes filtrés par entreprise
  * Ingestion, aperçu et validation
  * Analyse, alertes et chat
* Validation stricte des données entrantes (schémas Pydantic).
* Liaison avec le pipeline ML de Farid et l'orchestration Gemini.
* Tests unitaires et d'intégration API + persistance.
* Préparation de la présentation de l'architecture backend et sécurité Supabase.

### 3. Farid — Data / ML / Structuration & Analyse
* Amélioration du pipeline de nettoyage et normalisation des données.
* Traitement des données tabulaires et standardisation vers le schéma commun.
* Algorithmes de structuration et détection d'incohérences / valeurs manquantes.
* Calcul des indicateurs financiers et métiers : CA, marge %, bénéfice, classements.
* Algorithmes de détection d'anomalies (Z-score ou équivalent) et analyse des tendances.
* Calcul des seuils d'alerte et des ruptures de stock.
* Préparation des jeux de données formatés pour les graphiques du dashboard.
* Moteur de recommandations automatiques exploitables.
* Modèle de prévision simple et robuste si le temps le permet (sans risque pour la stabilité).
* Tests sur jeux de données réels et présentation de la partie Data/ML.

### 4. Bienv — Architecture, Gemini, Intégration Transverse & Finalisation
* Maintien de l'architecture globale et respect absolu du pipeline commun.
* Coordination des contrats d'interface (Frontend ↔ Backend ↔ Supabase ↔ ML).
* Implémentation et affinage des fonctionnalités Gemini côté serveur.
* Logique d'ancrage de l'assistant IA restreinte aux données de l'entreprise sélectionnée.
* Supervision de la structuration des documents non tabulaires.
* Supervision et amélioration du générateur de rapport PDF final.
* Revue transverse de sécurité (RLS, validation des accès, clés d'API masquées).
* Réalisation des tests end-to-end sur le parcours complet.
* Centralisation de l'intégration sur la branche `dev` et résolution des blocages.
* Coordination de la répétition générale et présentation de la vision globale.

---

## 6. Dépendances et Matrice de Collaboration

| Étape | Responsables | Dépendance préalable |
| :--- | :--- | :--- |
| **Authentification & Protection** | Uriel + Imma | Configuration Supabase Auth → Intégration dans le front |
| **Multi-entreprises & Données** | Uriel | Modèle de données Supabase + endpoints dédiés |
| **Structuration des données** | Farid + Bienv | Backend d'ingestion + pipeline commun |
| **Analyse / ML** | Farid | Données nettoyées au format canonique |
| **Dashboard / Graphiques** | Imma | Endpoints d'analyse fournissant les structures attendues |
| **Assistant IA / Gemini** | Bienv + Uriel | Données d'analyse calculées + API serveur sécurisée |
| **Alertes de stock** | Farid + Uriel + Imma | Détection ML/règles → API Backend → Composant Front |
| **Rapport final** | Bienv + Imma + Uriel | Analyses calculées + template de rendu PDF |
| **Tests finaux e2e** | Toute l'équipe | Toutes les briques connectées dans le parcours |

---

## 7. Ordre des Priorités de Développement V2

1. **Priorité 1** : Authentification, récupération de compte, Google OAuth, protection des routes (`AuthGuard`), mise en place Supabase Auth.
2. **Priorité 2** : Multi-entreprises, modèle relationnel Supabase, Row Level Security (RLS) et isolation stricte.
3. **Priorité 3** : Gestion produits/ventes par entreprise, import de fichiers, structuration et validation des données.
4. **Priorité 4** : Analyse ML, calcul des KPI et fourniture des données structurées pour le dashboard.
5. **Priorité 5** : Nouveaux graphiques du dashboard et alertes de stock visibles.
6. **Priorité 6** : Intégration Gemini serveur, assistant conversationnel contextualisé et recommandations directes.
7. **Priorité 7** : Génération et téléchargement du rapport final d'analyse (PDF).
8. **Priorité 8** : Finitions responsive, harmonisation visuelle, notifications toasts, corrections de bugs et tests end-to-end.

---

## 8. État des Branches Git et Suivi des Divergences

* **`main`** : Branche de production / version stable démontrable.
* **`dev`** : Branche d'intégration collective (actuellement commit `99a9bbe`).
* **`feature/v2-mvp`** : Branche dédiée à la V2, initialisée à partir de `dev` (`99a9bbe`).
* **`imma_frontend`** :
  * Dernier commit : `4719113` (*Modification des fonctionnalités du frontend*, 18 sept. 2026).
  * Contient un travail graphique et fonctionnel considérable (+5555 lignes, 39 fichiers).
  * **Point d'attention majeur** : Basée sur l'ancienne révision `7b6a762` (en retard de 38 commits par rapport à `dev`). Doit être réconciliée avec le backend réel et Supabase sans casser les routes d'API existantes.
* **`uriel_backend`** : Travaux V1 fusionnés dans `dev`. Sera réactivée pour les développements Supabase / V2.
* **`farid_ml`** : Moteur V1 fusionné dans `dev`.

---

## 9. Schéma de Données Cible Supabase (Spécification Technique V2)

### Table `profiles`
* `id` : UUID (Primary Key, référence `auth.users.id`)
* `email` : Text
* `first_name` : Text
* `last_name` : Text
* `avatar_url` : Text (optionnel)
* `created_at` : Timestamp with time zone

### Table `companies`
* `id` : UUID (Primary Key, default `gen_random_uuid()`)
* `name` : Text (Nom de l'entreprise)
* `category` : Text (Secteur d'activité)
* `currency` : Text (par défaut `'FCFA'`)
* `created_by` : UUID (référence `profiles.id`)
* `created_at` : Timestamp with time zone

### Table `company_members`
* `id` : UUID (Primary Key)
* `company_id` : UUID (référence `companies.id`, ON DELETE CASCADE)
* `user_id` : UUID (référence `profiles.id`, ON DELETE CASCADE)
* `role` : Text (`'owner'`, `'admin'`, `'member'`)
* `created_at` : Timestamp with time zone
* *Contrainte unique* : `(company_id, user_id)`

### Table `products`
* `id` : UUID (Primary Key)
* `company_id` : UUID (référence `companies.id`, ON DELETE CASCADE)
* `sku` : Text
* `name` : Text
* `category` : Text
* `unit_cost` : Numeric
* `unit_price` : Numeric
* `stock_quantity` : Numeric
* `low_stock_threshold` : Numeric
* `created_at` : Timestamp with time zone
* *Contrainte unique* : `(company_id, lower(sku))`

### Table `sales`
* `id` : UUID (Primary Key)
* `company_id` : UUID (référence `companies.id`, ON DELETE CASCADE)
* `product_sku` : Text
* `quantity` : Numeric
* `unit_price` : Numeric
* `unit_cost` : Numeric
* `sold_at` : Timestamp with time zone
* `channel` : Text
* `created_at` : Timestamp with time zone

### Table `analyses`
* `id` : UUID (Primary Key)
* `company_id` : UUID (référence `companies.id`, ON DELETE CASCADE)
* `source` : Text
* `result` : JSONB (KPIs, tendances, alertes, recommandations)
* `created_at` : Timestamp with time zone

### Politiques RLS (Row Level Security)
* Chaque requête vérifie : `company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())`.
* Seuls les membres autorisés peuvent lire ou écrire les données relatives à leur entreprise.

---

## 10. Règle d'Or de Suivi de Mémoire

> **Directive Antigravity** : Ce fichier `AGY.md` est mis à jour à chaque étape structurante, nouvelle décision d'architecture, contrat modifié ou arbitrage technique, afin de maintenir un contexte permanent, fiable et complet.

---

## 11. Journal d'Avancement des Travaux V2

### Phase 1 : Socle Fondateur — Supabase, Multi-Entreprises & Intégration UI (Terminée)
* **Date** : 21 septembre 2026
* **Réalisations** :
  1. **Schéma Supabase V2 (`backend/supabase_schema_v2.sql`)** :
     * Création des tables `profiles`, `companies`, `company_members`, `products`, `sales`, `analyses`.
     * Clés étrangères avec suppression en cascade (`ON DELETE CASCADE`).
     * Politiques d'étanchéité **Row Level Security (RLS)** actives sur toutes les tables.
     * Trigger PostgreSQL `on_auth_user_created` créant automatiquement le profil et une entreprise initiale par défaut lors de chaque inscription.
  2. **Backend FastAPI & Multi-Entreprises** :
     * Module `backend/app/services/supabase_client.py` assurant la communication Supabase ou un repli local transparent dans `JsonStore`.
     * Endpoints `/api/companies` (liste, création, détail, mise à jour).
     * Schémas Pydantic `CompanyIn`, `CompanyUpdate`, `CompanyOut` dans `common.py`.
     * 4 nouveaux tests unitaires (`backend/tests/test_companies.py`), portant la suite à **95 tests automatisés validés à 100 %**.
  3. **Intégration Frontend Chirurgicale (sans régression)** :
     * Système de notifications : `ToastContext.tsx`.
     * Gardien de navigation : `AuthGuard.tsx` protégeant les routes privées.
     * Sélecteur d'entreprise : `CompanySelector.tsx` connecté à `CompanyContext.tsx` et à l'API backend `/api/companies`.
     * Authentification enrichie : modale `GoogleAccountModal.tsx`, formulaires `ForgotPasswordForm.tsx` et page `/mot-de-passe-oublie`.
     * Intégration complète des 1902 lignes de classes CSS V2 dans `globals.css` et enrichissement de `Icons.tsx` sans supprimer `IconFileImage`.
     * Compilation Next.js (`npm run build`) validée sans aucune erreur (12 pages statiques générées).

### Phase 2 : Isolation Hermétique des Données & Enrichissement Métier (Terminée)
* **Date** : 21 septembre 2026
* **Réalisations** :
  1. **Isolation Stricte Multi-Entreprises (`X-Company-ID`)** :
     * Dépendance FastAPI `current_company` dans `backend/app/api/auth.py` : intercepte l'en-tête HTTP `X-Company-ID`, valide les droits d'appartenance de l'utilisateur (renvoie 403 `company_access_denied` si non autorisé) et offre un repli automatique et fluide vers l'entreprise par défaut si l'en-tête est omis.
     * Découpage du store local par entreprise (`get_company_store` dans `backend/app/services/store.py`).
     * Cloisonnement complet de toutes les routes métier :
       - `backend/app/api/products.py` : catalogue isolé par entreprise.
       - `backend/app/api/sales.py` : ventes isolées par entreprise.
       - `backend/app/api/analysis.py` & `backend/app/services/pipeline.py` : calculs d'analyses cloisonnés par entreprise en respectant la règle du pipeline unique.
       - `backend/app/api/alerts.py` : alertes de stock isolées par entreprise.
       - `backend/app/api/chat.py` : chatbot contextualisé sur l'analyse de l'entreprise courante.
       - `backend/app/api/ingestion.py` : imports et validations interactives rattachés à l'entreprise courante.
       - `backend/app/api/reports.py` : rapports PDF et Word générés à partir des données de l'entreprise courante.
  2. **Client API Frontend (`frontend/src/services/api.ts`)** :
     * Injection systématique de l'en-tête `X-Company-ID` dans toutes les requêtes `request<T>()` et `reports.download()` à partir de `localStorage.getItem("bizia_active_company_id")`.
  3. **Panneaux Métier Enrichis** :
     * `ProductsPanel.tsx` : rechargement automatique au changement d'entreprise, recherche textuelle (référence, nom), filtre par catégorie dynamique, filtre par niveau de stock (Tout / Faible / Normal), calcul et affichage direct de la marge unitaire et de son ratio.
     * `SalesPanel.tsx` : rechargement automatique au changement d'entreprise, sélecteur de canal (`Boutique`, `Web`, `WhatsApp`, `B2B`, `Autre`), affichage du badge canal dans l'historique des ventes, multi-devises dynamique.
     * `format.ts` : prise en charge du paramètre de devise pour tous les affichages monétaires.
  4. **Validation Automatisée & Tests** :
     * Création de `backend/tests/test_company_isolation.py` (3 tests validant l'isolation de catalogue, l'invisibilité des ventes d'une entreprise dans une autre, le 403 sur tentative d'accès non autorisé, et le repli automatique).
     * Isolation hermétique des tests vis-à-vis du Supabase distant dans `backend/tests/conftest.py`.
     * **98 tests automatisés exécutés avec 100 % de succès (`.venv/bin/pytest`)**.
     * **Compilation Next.js (`npm run build`) validée avec 0 erreur (12 pages statiques)**.

### Phase 3 : Finalisation Multi-Entreprises (Dashboard, Chat & Rapports PDF/Word) (Terminée)
* **Date** : 21 septembre 2026
* **Réalisations** :
  1. **Rapports PDF & Word Contextualisés (`backend/app/api/reports.py`)** :
     * Injection dynamique des métadonnées de l'entreprise (`company_name`, `company_category`, `currency`) dans le modèle de génération `_report_payload`.
     * Rendu ReportLab (PDF) et python-docx (Word) arborant le nom de l'entreprise, sa catégorie et la devise officielle configurée.
     * Nommage automatique et nettoyé du fichier téléchargé (`bizia-rapport-<nom_entreprise>.(pdf|docx)` via l'en-tête `Content-Disposition`).
  2. **Tableau de Bord Contextualisé (`frontend/src/components/dashboard/DashboardPanel.tsx`)** :
     * Branchement sur `useCompany()`.
     * Rechargement automatique des métriques et alertes lors du changement d'entreprise active.
     * Formatage multi-devises automatique des KPIs (chiffre d'affaires, coûts, bénéfices) selon la devise de l'entreprise sélectionnée.
     * Textes et boutons d'appel à l'action personnalisés avec le nom de l'entreprise courante.
  3. **Assistant IA / Chatbot Contextualisé (`frontend/src/components/chat/ChatPanel.tsx`)** :
     * Branchement sur `useCompany()`.
     * Réinitialisation de l'historique de conversation lors d'un basculement d'entreprise pour éliminer tout risque de confusion de contexte.
     * En-tête et suggestions contextualisés sur l'entreprise active.
  4. **Validation Globale** :
     * `pytest` : 98/98 tests validés avec succès (100 %).
     * Next.js build : 12/12 pages statiques compilées avec succès, 0 erreur TypeScript/ESLint.
