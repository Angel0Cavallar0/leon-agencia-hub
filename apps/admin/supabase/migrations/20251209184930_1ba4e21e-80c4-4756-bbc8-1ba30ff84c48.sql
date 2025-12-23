-- CRM Pipelines (Funis)
CREATE TABLE public.crm_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- CRM Stages (Etapas)
CREATE TABLE public.crm_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    order_index INTEGER DEFAULT 0,
    is_won BOOLEAN DEFAULT false,
    is_lost BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- CRM Companies (Empresas)
CREATE TABLE public.crm_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    city TEXT,
    state TEXT,
    address TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- CRM Contacts (Contatos)
CREATE TABLE public.crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT,
    company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- CRM Deals (Negócios)
CREATE TABLE public.crm_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    value DECIMAL(15,2) DEFAULT 0,
    pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id),
    stage_id UUID NOT NULL REFERENCES public.crm_stages(id),
    company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
    expected_close_date DATE,
    closed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- CRM Deal Notes (Timeline/Notas)
CREATE TABLE public.crm_deal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CRM Settings (Configurações do CRM)
CREATE TABLE public.crm_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

-- Function to check CRM access
CREATE OR REPLACE FUNCTION public.user_has_crm_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND crm_access = true
    );
$$;

-- Function to check if user is admin/manager (can see all data)
CREATE OR REPLACE FUNCTION public.user_is_crm_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'manager')
          AND crm_access = true
    );
$$;

-- Function to get user's deals (for filtering contacts/companies)
CREATE OR REPLACE FUNCTION public.user_deal_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT id FROM public.crm_deals WHERE owner_id = auth.uid();
$$;

-- RLS Policies for crm_pipelines (everyone with CRM access can view, admin/manager can manage)
CREATE POLICY "CRM users can view pipelines" ON public.crm_pipelines
FOR SELECT USING (user_has_crm_access());

CREATE POLICY "Admin/manager can manage pipelines" ON public.crm_pipelines
FOR ALL USING (user_is_crm_admin()) WITH CHECK (user_is_crm_admin());

-- RLS Policies for crm_stages
CREATE POLICY "CRM users can view stages" ON public.crm_stages
FOR SELECT USING (user_has_crm_access());

CREATE POLICY "Admin/manager can manage stages" ON public.crm_stages
FOR ALL USING (user_is_crm_admin()) WITH CHECK (user_is_crm_admin());

-- RLS Policies for crm_companies
CREATE POLICY "Admin/manager can view all companies" ON public.crm_companies
FOR SELECT USING (user_is_crm_admin());

CREATE POLICY "Users can view companies linked to their deals" ON public.crm_companies
FOR SELECT USING (
    user_has_crm_access() AND (
        id IN (SELECT company_id FROM public.crm_deals WHERE owner_id = auth.uid())
    )
);

CREATE POLICY "CRM users can create companies" ON public.crm_companies
FOR INSERT WITH CHECK (user_has_crm_access());

CREATE POLICY "Admin/manager can update companies" ON public.crm_companies
FOR UPDATE USING (user_is_crm_admin());

CREATE POLICY "Users can update their own companies" ON public.crm_companies
FOR UPDATE USING (
    user_has_crm_access() AND 
    id IN (SELECT company_id FROM public.crm_deals WHERE owner_id = auth.uid())
);

-- RLS Policies for crm_contacts
CREATE POLICY "Admin/manager can view all contacts" ON public.crm_contacts
FOR SELECT USING (user_is_crm_admin());

CREATE POLICY "Users can view contacts linked to their deals" ON public.crm_contacts
FOR SELECT USING (
    user_has_crm_access() AND (
        id IN (SELECT contact_id FROM public.crm_deals WHERE owner_id = auth.uid()) OR
        company_id IN (SELECT company_id FROM public.crm_deals WHERE owner_id = auth.uid())
    )
);

CREATE POLICY "CRM users can create contacts" ON public.crm_contacts
FOR INSERT WITH CHECK (user_has_crm_access());

CREATE POLICY "Admin/manager can update contacts" ON public.crm_contacts
FOR UPDATE USING (user_is_crm_admin());

CREATE POLICY "Users can update contacts linked to their deals" ON public.crm_contacts
FOR UPDATE USING (
    user_has_crm_access() AND (
        id IN (SELECT contact_id FROM public.crm_deals WHERE owner_id = auth.uid()) OR
        company_id IN (SELECT company_id FROM public.crm_deals WHERE owner_id = auth.uid())
    )
);

-- RLS Policies for crm_deals
CREATE POLICY "Admin/manager can view all deals" ON public.crm_deals
FOR SELECT USING (user_is_crm_admin());

CREATE POLICY "Users can view their own deals" ON public.crm_deals
FOR SELECT USING (user_has_crm_access() AND owner_id = auth.uid());

CREATE POLICY "CRM users can create deals" ON public.crm_deals
FOR INSERT WITH CHECK (user_has_crm_access());

CREATE POLICY "Admin/manager can update all deals" ON public.crm_deals
FOR UPDATE USING (user_is_crm_admin());

CREATE POLICY "Users can update their own deals" ON public.crm_deals
FOR UPDATE USING (user_has_crm_access() AND owner_id = auth.uid());

CREATE POLICY "Admin/manager can delete deals" ON public.crm_deals
FOR DELETE USING (user_is_crm_admin());

-- RLS Policies for crm_deal_notes
CREATE POLICY "Users can view notes on accessible deals" ON public.crm_deal_notes
FOR SELECT USING (
    user_has_crm_access() AND (
        user_is_crm_admin() OR
        deal_id IN (SELECT id FROM public.crm_deals WHERE owner_id = auth.uid())
    )
);

CREATE POLICY "Users can create notes on accessible deals" ON public.crm_deal_notes
FOR INSERT WITH CHECK (
    user_has_crm_access() AND (
        user_is_crm_admin() OR
        deal_id IN (SELECT id FROM public.crm_deals WHERE owner_id = auth.uid())
    )
);

-- RLS Policies for crm_settings
CREATE POLICY "Admin/manager can manage CRM settings" ON public.crm_settings
FOR ALL USING (user_is_crm_admin()) WITH CHECK (user_is_crm_admin());

-- Insert default pipelines and stages
INSERT INTO public.crm_pipelines (name, description, is_default, order_index) VALUES
('Prospecção de Leads', 'Funil para captação e qualificação de novos leads', true, 1),
('Nutrição de Clientes', 'Funil para acompanhamento e nutrição de clientes fechados', false, 2);

-- Get pipeline IDs for stages
DO $$
DECLARE
    prospeccao_id UUID;
    nutricao_id UUID;
BEGIN
    SELECT id INTO prospeccao_id FROM public.crm_pipelines WHERE name = 'Prospecção de Leads';
    SELECT id INTO nutricao_id FROM public.crm_pipelines WHERE name = 'Nutrição de Clientes';
    
    -- Stages for Prospecção de Leads
    INSERT INTO public.crm_stages (pipeline_id, name, color, order_index, is_won, is_lost) VALUES
    (prospeccao_id, 'Novo Lead', '#6B7280', 1, false, false),
    (prospeccao_id, 'Contato Inicial', '#3B82F6', 2, false, false),
    (prospeccao_id, 'Qualificação', '#8B5CF6', 3, false, false),
    (prospeccao_id, 'Proposta Enviada', '#F59E0B', 4, false, false),
    (prospeccao_id, 'Negociação', '#EC4899', 5, false, false),
    (prospeccao_id, 'Fechado - Ganho', '#10B981', 6, true, false),
    (prospeccao_id, 'Fechado - Perdido', '#EF4444', 7, false, true);
    
    -- Stages for Nutrição de Clientes
    INSERT INTO public.crm_stages (pipeline_id, name, color, order_index, is_won, is_lost) VALUES
    (nutricao_id, 'Onboarding', '#3B82F6', 1, false, false),
    (nutricao_id, 'Implementação', '#8B5CF6', 2, false, false),
    (nutricao_id, 'Acompanhamento', '#10B981', 3, false, false),
    (nutricao_id, 'Upsell/Cross-sell', '#F59E0B', 4, false, false),
    (nutricao_id, 'Renovação', '#EC4899', 5, false, false);
END $$;

-- Function to move deal to nurturing pipeline when closed as won
CREATE OR REPLACE FUNCTION public.handle_deal_won()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    nurturing_pipeline_id UUID;
    first_nurturing_stage_id UUID;
    webhook_url TEXT;
BEGIN
    -- Only trigger when status changes to 'won'
    IF NEW.status = 'won' AND (OLD.status IS NULL OR OLD.status != 'won') THEN
        -- Get the nurturing pipeline
        SELECT id INTO nurturing_pipeline_id 
        FROM public.crm_pipelines 
        WHERE name = 'Nutrição de Clientes' AND is_active = true
        LIMIT 1;
        
        -- Get the first stage of the nurturing pipeline
        IF nurturing_pipeline_id IS NOT NULL THEN
            SELECT id INTO first_nurturing_stage_id
            FROM public.crm_stages
            WHERE pipeline_id = nurturing_pipeline_id
            ORDER BY order_index
            LIMIT 1;
            
            -- Create a new deal in the nurturing pipeline
            IF first_nurturing_stage_id IS NOT NULL THEN
                INSERT INTO public.crm_deals (
                    title, value, pipeline_id, stage_id, company_id, contact_id, 
                    owner_id, status, notes, created_at
                ) VALUES (
                    NEW.title || ' - Nutrição',
                    NEW.value,
                    nurturing_pipeline_id,
                    first_nurturing_stage_id,
                    NEW.company_id,
                    NEW.contact_id,
                    NEW.owner_id,
                    'open',
                    'Negócio transferido automaticamente após fechamento.',
                    now()
                );
            END IF;
        END IF;
        
        -- Update closed_at timestamp
        NEW.closed_at = now();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for deal won
CREATE TRIGGER on_deal_won
    BEFORE UPDATE ON public.crm_deals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_deal_won();

-- Create indexes for performance
CREATE INDEX idx_crm_deals_owner ON public.crm_deals(owner_id);
CREATE INDEX idx_crm_deals_pipeline ON public.crm_deals(pipeline_id);
CREATE INDEX idx_crm_deals_stage ON public.crm_deals(stage_id);
CREATE INDEX idx_crm_deals_company ON public.crm_deals(company_id);
CREATE INDEX idx_crm_deals_contact ON public.crm_deals(contact_id);
CREATE INDEX idx_crm_contacts_company ON public.crm_contacts(company_id);
CREATE INDEX idx_crm_stages_pipeline ON public.crm_stages(pipeline_id);