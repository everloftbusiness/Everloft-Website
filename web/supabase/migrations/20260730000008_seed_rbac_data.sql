-- Seed data: default permissions, the 11 real Everloft roles (matching the
-- roles already wired into the existing /dashboard/{role} UI — see
-- src/lib/dashboard-roles.ts), and their default permission grants.
--
-- This is DATA, not code — Super Admin can add a "Future Custom Role" or
-- rebalance any grant later purely via UPDATE/INSERT statements, with zero
-- app deploys. That is what "never hardcode permissions" means in practice.

insert into public.permissions (key, name, description, category) values
  ('view_dashboard',      'View Dashboard',        'Access the dashboard overview and one''s own workspace.', 'general'),
  ('manage_users',        'Manage Users',          'Create, edit, deactivate users and assign roles.',        'administration'),
  ('manage_roles',        'Manage Roles',          'Create/edit roles and their permission grants.',          'administration'),
  ('manage_permissions',  'Manage Permissions',    'Create/edit the permission catalogue itself.',            'administration'),
  ('manage_properties',   'Manage Properties',     'Create/edit property records and assignments.',           'properties'),
  ('manage_bookings',     'Manage Bookings',       'View and manage guest bookings and stays.',               'operations'),
  ('view_financials',     'View Financials',       'View revenue, payouts, and financial reports.',           'finance'),
  ('manage_expenses',     'Manage Expenses',       'Record and approve operational expenses.',                'finance'),
  ('view_reports',        'View Reports',          'Access analytics, activity logs, and audit history.',     'reporting'),
  ('manage_investors',    'Manage Investors',      'Manage investor records and portfolio data.',             'stakeholders'),
  ('manage_owners',       'Manage Owners',         'Manage property owner records and agreements.',           'stakeholders'),
  ('manage_housekeeping', 'Manage Housekeeping',   'Assign and track housekeeping tasks.',                    'operations'),
  ('manage_maintenance',  'Manage Maintenance',    'Assign and track maintenance tickets.',                   'operations')
on conflict (key) do nothing;

insert into public.roles (slug, name, description, level, is_system) values
  ('super_admin',        'Super Admin',        'Full platform authority across every module.',                    100, true),
  ('operations_manager',  'Operations Manager', 'Runs day-to-day property and booking operations.',                80,  true),
  ('finance_admin',      'Finance Admin',      'Owns financial reporting, payouts, and expenses.',                80,  true),
  ('tech_admin',         'Tech Admin',         'Manages platform users, roles, and system health.',               80,  true),
  ('property_manager',   'Property Manager',   'Manages an assigned portfolio of properties.',                    60,  true),
  ('guest_support',      'Guest Support',      'Handles guest bookings and support requests.',                    50,  true),
  ('property_owner',     'Property Owner',     'Views and manages their own property''s performance.',            40,  true),
  ('investor',           'Investor',           'Views portfolio performance for invested properties.',            40,  true),
  ('housekeeping',       'Housekeeping',       'Executes housekeeping tasks on assigned properties.',             20,  true),
  ('maintenance',        'Maintenance',        'Executes maintenance tickets on assigned properties.',            20,  true),
  ('guest',              'Guest',              'Guest-facing account for bookings and stays.',                   10,  true)
on conflict (slug) do nothing;

-- super_admin: every permission that exists.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug = 'super_admin'
on conflict (role_id, permission_id) do nothing;

-- Everyone else: a scoped, real-world default. All of these can be
-- rebalanced later by editing rows, not code.
with grants (role_slug, permission_key) as (
  values
    ('operations_manager', 'view_dashboard'),
    ('operations_manager', 'manage_properties'),
    ('operations_manager', 'manage_bookings'),
    ('operations_manager', 'view_reports'),
    ('operations_manager', 'manage_housekeeping'),
    ('operations_manager', 'manage_maintenance'),
    ('operations_manager', 'manage_owners'),

    ('finance_admin', 'view_dashboard'),
    ('finance_admin', 'view_financials'),
    ('finance_admin', 'manage_expenses'),
    ('finance_admin', 'view_reports'),

    ('tech_admin', 'view_dashboard'),
    ('tech_admin', 'manage_users'),
    ('tech_admin', 'view_reports'),

    ('property_manager', 'view_dashboard'),
    ('property_manager', 'manage_properties'),
    ('property_manager', 'manage_bookings'),
    ('property_manager', 'manage_housekeeping'),
    ('property_manager', 'manage_maintenance'),
    ('property_manager', 'view_reports'),

    ('guest_support', 'view_dashboard'),
    ('guest_support', 'manage_bookings'),

    ('property_owner', 'view_dashboard'),

    ('investor', 'view_dashboard'),

    ('housekeeping', 'view_dashboard'),
    ('housekeeping', 'manage_housekeeping'),

    ('maintenance', 'view_dashboard'),
    ('maintenance', 'manage_maintenance'),

    ('guest', 'view_dashboard')
)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.key = g.permission_key
on conflict (role_id, permission_id) do nothing;
