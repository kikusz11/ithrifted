-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active coupons (for checkout)
CREATE POLICY "Everyone can read active coupons" ON coupons
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Policy: Admins can do everything (assuming admin check logic exists or handled via service role)
-- For simplicity in this context, we might rely on the app logic or add a specific admin policy if 'profiles' table has 'is_admin'
-- This policy allows authenticated users to read all coupons (e.g. for admin panel if they are admin)
CREATE POLICY "Authenticated users can read all coupons" ON coupons
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample coupons
INSERT INTO coupons (code, discount_percent, description, expires_at)
VALUES 
  ('ITHRIFTED20', 20, '20% kedvezmény minden termékre', NULL),
  ('WELCOME10', 10, '10% üdvözlő kedvezmény', NULL),
  ('SUMMER5', 5, '5% nyári extra kedvezmény', NOW() + INTERVAL '30 days')
ON CONFLICT (code) DO NOTHING;
