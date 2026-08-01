-- Widens property_rules.rule_key to support the preset-picker + custom
-- free-text house rules redesign (docs/PROPERTY_SETUP_DASHBOARD_V2_
-- IMPROVEMENTS.md §7). 'preset' covers any of the ~65 standard rules
-- (represented by rule_text, not a semantic key per rule); 'custom' covers
-- host-written free text (e.g. a specific quiet-hours range). Existing rows
-- (smoking/pets/parties, still written by the House Rules toggles) keep
-- working — this is additive, not a replacement of those keys.
alter table public.property_rules drop constraint property_rules_rule_key_check;
alter table public.property_rules add constraint property_rules_rule_key_check check (rule_key in (
  'quiet_hours', 'smoking', 'pets', 'visitors', 'parties',
  'commercial_shoots', 'alcohol', 'id_required', 'minimum_age',
  'cleaning', 'waste_disposal', 'parking', 'community', 'other',
  'preset', 'custom'
));
