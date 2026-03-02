-- ============================================
-- RESVYSION - Supabase Database Schema
-- Maak een nieuw Supabase project aan op supabase.com
-- en voer dit SQL script uit in de SQL Editor
-- ============================================

-- ==========================================
-- 1. TENANTS (restaurant eigenaars)
-- ==========================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  restaurant_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'BE',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('trial', 'starter', 'pro')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. BOOKING SETTINGS (online boeking config)
-- ==========================================
CREATE TABLE IF NOT EXISTS booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_slug TEXT UNIQUE NOT NULL,
  online_booking_enabled BOOLEAN DEFAULT true,
  max_reservations_per_slot INTEGER DEFAULT 5,
  max_party_size INTEGER DEFAULT 10,
  min_advance_hours INTEGER DEFAULT 2,
  max_advance_days INTEGER DEFAULT 60,
  available_time_slots JSONB DEFAULT '["11:00","11:30","12:00","12:30","13:00","13:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30"]',
  booking_days JSONB DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]',
  reservation_duration_minutes INTEGER DEFAULT 120,
  auto_confirm BOOLEAN DEFAULT true,
  require_phone BOOLEAN DEFAULT true,
  require_email BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. NO-SHOW SETTINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS no_show_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_slug TEXT UNIQUE NOT NULL,
  warning_threshold INTEGER DEFAULT 2,
  block_threshold INTEGER DEFAULT 3,
  block_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 4. SECTIONS (zalen/zones)
-- ==========================================
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. TABLES (tafels)
-- ==========================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT NOT NULL,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  table_number TEXT NOT NULL,
  seats INTEGER DEFAULT 4,
  shape TEXT DEFAULT 'square' CHECK (shape IN ('square', 'round', 'rectangle')),
  table_type TEXT DEFAULT 'both' CHECK (table_type IN ('reservation', 'walkin', 'both')),
  pos_x FLOAT DEFAULT 100,
  pos_y FLOAT DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 6. RESERVATIONS (reserveringen)
-- ==========================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT NOT NULL,
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  
  -- Klantgegevens
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  party_size INTEGER NOT NULL DEFAULT 2,
  
  -- Timing
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  time_from TIME,
  time_to TIME,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  source TEXT DEFAULT 'online' CHECK (source IN ('online', 'phone', 'walkin', 'admin')),
  
  -- Extra
  notes TEXT,
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  confirmation_token UUID DEFAULT gen_random_uuid(),
  confirmed_by_customer BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  whatsapp_sent BOOLEAN DEFAULT false,
  is_occupied BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 7. INDEXES voor snelheid
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_date ON reservations(tenant_slug, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_phone ON reservations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_tables_tenant ON restaurant_tables(tenant_slug);
CREATE INDEX IF NOT EXISTS idx_sections_tenant ON sections(tenant_slug);

-- ==========================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE no_show_settings ENABLE ROW LEVEL SECURITY;

-- Reserveringen zijn publiek leesbaar (voor beschikbaarheidscheck)
CREATE POLICY "Reservations public read" ON reservations FOR SELECT USING (true);
CREATE POLICY "Reservations public insert" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Reservations update" ON reservations FOR UPDATE USING (true);

-- Tafels en secties publiek leesbaar
CREATE POLICY "Tables public read" ON restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Tables manage" ON restaurant_tables FOR ALL USING (true);
CREATE POLICY "Sections public read" ON sections FOR SELECT USING (true);
CREATE POLICY "Sections manage" ON sections FOR ALL USING (true);

-- Instellingen publiek leesbaar
CREATE POLICY "Booking settings read" ON booking_settings FOR SELECT USING (true);
CREATE POLICY "Booking settings manage" ON booking_settings FOR ALL USING (true);
CREATE POLICY "No show settings read" ON no_show_settings FOR SELECT USING (true);
CREATE POLICY "No show settings manage" ON no_show_settings FOR ALL USING (true);

-- Tenants
CREATE POLICY "Tenants read" ON tenants FOR SELECT USING (true);
CREATE POLICY "Tenants insert" ON tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "Tenants update" ON tenants FOR UPDATE USING (true);

-- ==========================================
-- KLAAR! Kopieer de Project URL en anon key
-- naar je .env.local bestand
-- ==========================================
