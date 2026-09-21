-- ==============================================================================
-- BizIA — Schéma de Base de Données Relationnel V2 (Supabase / PostgreSQL)
-- ==============================================================================
-- Vision : Isolation multi-entreprises stricte avec Row Level Security (RLS),
-- intégrité référentielle, indexation pour requêtes rapides et triggers d'automatisation.
-- ==============================================================================

-- 1. Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Table `profiles` (Profils utilisateurs liés à Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour `profiles`
CREATE POLICY "Les utilisateurs peuvent consulter leur propre profil"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ==============================================================================
-- 3. Table `companies` (Entreprises administrées)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Commerce Général',
    currency TEXT DEFAULT 'FCFA' NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. Table `company_members` (Permissions & Rôles dans chaque entreprise)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE (company_id, user_id)
);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour `companies` et `company_members`
CREATE POLICY "Les membres peuvent voir leur entreprise"
    ON public.companies FOR SELECT
    USING (
        id IN (
            SELECT cm.company_id FROM public.company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Les propriétaires et admins peuvent modifier leur entreprise"
    ON public.companies FOR UPDATE
    USING (
        id IN (
            SELECT cm.company_id FROM public.company_members cm
            WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Tout utilisateur authentifié peut créer une entreprise"
    ON public.companies FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Les membres peuvent voir les autres membres de leur entreprise"
    ON public.company_members FOR SELECT
    USING (
        company_id IN (
            SELECT cm.company_id FROM public.company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Les propriétaires et admins peuvent gérer les membres"
    ON public.company_members FOR ALL
    USING (
        company_id IN (
            SELECT cm.company_id FROM public.company_members cm
            WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
        )
    );

-- ==============================================================================
-- 5. Table `products` (Catalogue et stock par entreprise)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Général',
    unit_cost NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    unit_price NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    stock_quantity NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    low_stock_threshold NUMERIC(12, 2) DEFAULT 5.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS products_company_sku_idx 
    ON public.products (company_id, lower(sku));

CREATE INDEX IF NOT EXISTS products_company_idx 
    ON public.products (company_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accès aux produits restreint aux membres de l'entreprise"
    ON public.products FOR ALL
    USING (
        company_id IN (
            SELECT cm.company_id FROM public.company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 6. Table `sales` (Historique des transactions de vente)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_sku TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    unit_cost NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    sold_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    channel TEXT DEFAULT 'Boutique' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS sales_company_date_idx 
    ON public.sales (company_id, sold_at DESC);

CREATE INDEX IF NOT EXISTS sales_company_sku_idx 
    ON public.sales (company_id, product_sku);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accès aux ventes restreint aux membres de l'entreprise"
    ON public.sales FOR ALL
    USING (
        company_id IN (
            SELECT cm.company_id FROM public.company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 7. Table `analyses` (Résultats ML, KPI, alertes et recommandations)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    source TEXT DEFAULT 'manual' NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS analyses_company_date_idx 
    ON public.analyses (company_id, created_at DESC);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accès aux analyses restreint aux membres de l'entreprise"
    ON public.analyses FOR ALL
    USING (
        company_id IN (
            SELECT cm.company_id FROM public.company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 8. Triggers automatiques (Profils & Entreprise par défaut à l'inscription)
-- ==============================================================================

-- Création automatique du profil lors de l'inscription via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
    v_company_id UUID;
    v_company_name TEXT;
BEGIN
    v_first_name := COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1));
    v_last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');
    
    -- Insertion du profil
    INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
    VALUES (new.id, new.email, v_first_name, v_last_name, new.raw_user_meta_data->>'avatar_url');

    -- Création d'une entreprise initiale par défaut pour ce nouvel utilisateur
    v_company_name := 'Mon Entreprise (' || v_first_name || ')';
    INSERT INTO public.companies (name, category, currency, created_by)
    VALUES (v_company_name, 'Commerce Général', 'FCFA', new.id)
    RETURNING id INTO v_company_id;

    -- Ajout en tant que 'owner'
    INSERT INTO public.company_members (company_id, user_id, role)
    VALUES (v_company_id, new.id, 'owner');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencheur sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
