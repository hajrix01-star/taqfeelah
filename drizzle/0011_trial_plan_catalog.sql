INSERT INTO "plan_catalog" (
  "plan_code",
  "display_name_ar",
  "display_name_en",
  "price_monthly_halalas",
  "price_yearly_halalas",
  "max_stores",
  "max_employees",
  "trial_days",
  "features",
  "is_active",
  "sort_order"
) VALUES (
  'trial',
  'تجربة',
  'Trial',
  0,
  NULL,
  3,
  3,
  15,
  '{"isTrialPlan":true}'::jsonb,
  true,
  0
)
ON CONFLICT ("plan_code") DO UPDATE SET
  "display_name_ar" = EXCLUDED."display_name_ar",
  "display_name_en" = EXCLUDED."display_name_en",
  "price_monthly_halalas" = EXCLUDED."price_monthly_halalas",
  "price_yearly_halalas" = EXCLUDED."price_yearly_halalas",
  "max_stores" = EXCLUDED."max_stores",
  "max_employees" = EXCLUDED."max_employees",
  "trial_days" = EXCLUDED."trial_days",
  "features" = EXCLUDED."features",
  "is_active" = EXCLUDED."is_active",
  "sort_order" = EXCLUDED."sort_order",
  "updated_at" = now();
