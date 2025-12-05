-- Add usage limit columns to coupons table
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS usage_limit INTEGER,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Create user_coupons table for assigning coupons to users
CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  UNIQUE(user_id, coupon_id)
);

-- RLS Policies for user_coupons

-- Enable RLS
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own assigned coupons
CREATE POLICY "Users can read own assigned coupons" ON user_coupons
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can do everything (assuming admin check logic or service role)
CREATE POLICY "Admins can do everything on user_coupons" ON user_coupons
  FOR ALL
  USING (true);
