-- Migration: 20260926000001_booking_register_granular_lines.sql
-- Description: Expand public.booking_register view to expose granular dual-ledger lines matching Google Sheets
-- (Base Fare, Taxes, Services Charge, Base Fare 2, Rate Adjustment, Channel Fee, TDS, Add'l Income, Bank Account)

drop view if exists public.booking_register;

create view public.booking_register with (security_invoker=true) as
select 
  b.*,
  g.full_name as guest_name,
  g.email,
  g.phone,
  g.country,
  p.name as property_name,
  
  -- 🟢 Granular Guest Paid Ledger
  coalesce(f.guest_base_fare, 0) as guest_base_fare,
  coalesce(f.guest_taxes, 0) as guest_taxes,
  coalesce(f.guest_service_charge, 0) as guest_service_charge,
  coalesce(f.guest_total, 0) as guest_total,
  
  -- 🟣 Granular Host Payout Ledger
  coalesce(f.host_base_fare, 0) as host_base_fare,
  coalesce(f.host_rate_adjustment, 0) as host_rate_adjustment,
  coalesce(f.host_service_fee, 0) as host_service_fee,
  coalesce(f.host_taxes, 0) as host_taxes,
  coalesce(f.host_additional_income, 0) as host_additional_income,
  coalesce(f.host_total, 0) as host_total,
  
  -- Bank Settlement & Balances
  coalesce(t.guest_received, 0) as guest_received,
  coalesce(t.host_received, 0) as host_received,
  coalesce(t.deposit_held, 0) as deposit_held,
  t.primary_bank_account as amount_credited_bank,
  
  case when b.collection_mode = 'platform' then coalesce(f.host_total, 0) - coalesce(t.host_received, 0) else 0 end as payout_balance,
  case when b.collection_mode = 'direct' then coalesce(f.guest_total, 0) - coalesce(t.guest_received, 0) else null end as guest_balance

from public.bookings b
join public.guest_profiles g on g.id = b.primary_guest_id
join public.properties p on p.id = b.property_id

-- Lateral join for line item extraction
left join lateral (
  select 
    sum(amount) filter(where side = 'guest' and category = 'accommodation') as guest_base_fare,
    sum(amount) filter(where side = 'guest' and category = 'tax') as guest_taxes,
    sum(amount) filter(where side = 'guest' and category = 'guest_service_fee') as guest_service_charge,
    sum(amount) filter(where side = 'guest') as guest_total,
    
    sum(amount) filter(where side = 'host' and category = 'accommodation') as host_base_fare,
    sum(amount) filter(where side = 'host' and category = 'rate_adjustment') as host_rate_adjustment,
    abs(coalesce(sum(amount) filter(where side = 'host' and category = 'host_service_fee'), 0)) as host_service_fee,
    abs(coalesce(sum(amount) filter(where side = 'host' and category = 'tax'), 0)) as host_taxes,
    sum(amount) filter(where side = 'host' and category = 'additional_income') as host_additional_income,
    sum(amount) filter(where side = 'host') as host_total
  from public.booking_financial_lines
  where booking_id = b.id
) f on true

-- Lateral join for bank transactions
left join lateral (
  select 
    sum(case when tr.direction = 'inbound' then tr.amount else -tr.amount end) filter(where bp.payment_type = 'guest_collection') as guest_received,
    sum(case when tr.direction = 'inbound' then tr.amount else -tr.amount end) filter(where bp.payment_type = 'host_payout') as host_received,
    sum(case when tr.direction = 'inbound' then tr.amount else -tr.amount end) filter(where bp.payment_type = 'deposit') as deposit_held,
    max(tr.account_label) as primary_bank_account
  from public.booking_payments bp
  join public.transactions tr on tr.id = bp.transaction_id
  where bp.booking_id = b.id and tr.status = 'completed'
) t on true
where b.deleted_at is null;

grant select on public.booking_register to authenticated;
