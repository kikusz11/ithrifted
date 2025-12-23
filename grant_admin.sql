-- Add Admin Role to User
-- Cseréld ki az email címet, ha másik felhasználónak szeretnél jogot adni!

UPDATE public.profiles
SET role = 'admin'
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'mk.kikusz1@gmail.com'
);

-- Ellenőrzés: Kiírja az admin felhasználókat
SELECT * FROM public.profiles WHERE role = 'admin';
