-- Migration: Fix products.vendor_id values that mistakenly reference vendor_profiles.id
-- This updates products where vendor_id corresponds to a vendor_profiles.id
-- to use the correct users.id (vendor_profiles.user_id).

BEGIN;

UPDATE public.products p
SET vendor_id = vp.user_id
FROM public.vendor_profiles vp
WHERE p.vendor_id = vp.id
  AND p.vendor_id IS NOT NULL;

COMMIT;
