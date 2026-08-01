-- Seed data for every lookup/master table in the Property Management
-- Module. Exactly the brief's own lists — this is DATA, editable later by
-- any manage_properties holder, never a code change (same "permissions are
-- data" philosophy as the RBAC seed).

insert into public.property_types (slug, name, is_system, sort_order) values
  ('apartment',            'Apartment',             true, 10),
  ('villa',                'Villa',                 true, 20),
  ('independent_house',    'Independent House',     true, 30),
  ('studio',               'Studio',                true, 40),
  ('duplex',               'Duplex',                true, 50),
  ('penthouse',            'Penthouse',             true, 60),
  ('farmhouse',            'Farmhouse',             true, 70),
  ('cottage',              'Cottage',               true, 80),
  ('cabin',                'Cabin',                 true, 90),
  ('resort_villa',         'Resort Villa',          true, 100),
  ('serviced_apartment',   'Serviced Apartment',    true, 110),
  ('hotel_room',           'Hotel Room',            true, 120),
  ('shared_accommodation', 'Shared Accommodation',  true, 130),
  ('commercial_space',     'Commercial Space',      true, 140)
on conflict (slug) do nothing;

insert into public.property_status (slug, name, is_system, sort_order) values
  ('draft',          'Draft',          true, 10),
  ('pending_review', 'Pending Review', true, 20),
  ('active',         'Active',         true, 30),
  ('inactive',       'Inactive',       true, 40),
  ('maintenance',    'Maintenance',    true, 50),
  ('blocked',        'Blocked',        true, 60),
  ('archived',       'Archived',       true, 70),
  ('sold',           'Sold',           true, 80),
  ('leased',         'Leased',         true, 90)
on conflict (slug) do nothing;

insert into public.property_categories (slug, name, sort_order) values
  ('budget',  'Budget',  10),
  ('premium', 'Premium', 20),
  ('luxury',  'Luxury',  30)
on conflict (slug) do nothing;

insert into public.room_types (slug, name, sort_order) values
  ('master_bedroom', 'Master Bedroom', 10),
  ('bedroom',        'Bedroom',        20),
  ('kids_room',      'Kids Room',      30),
  ('living_room',    'Living Room',    40),
  ('kitchen',        'Kitchen',        50),
  ('dining',         'Dining',         60),
  ('bathroom',       'Bathroom',       70),
  ('terrace',        'Terrace',        80),
  ('balcony',        'Balcony',        90),
  ('store_room',     'Store Room',     100),
  ('utility_room',   'Utility Room',   110)
on conflict (slug) do nothing;

insert into public.amenity_master (slug, name, category, sort_order) values
  ('wifi',              'WiFi',                'internet',      10),
  ('smart_tv',          'Smart TV',            'entertainment', 20),
  ('netflix',           'Netflix',             'entertainment', 30),
  ('prime_video',       'Prime Video',         'entertainment', 40),
  ('refrigerator',      'Refrigerator',        'kitchen',       50),
  ('microwave',         'Microwave',           'kitchen',       60),
  ('coffee_machine',    'Coffee Machine',      'kitchen',       70),
  ('washing_machine',   'Washing Machine',     'laundry',       80),
  ('dryer',             'Dryer',               'laundry',       90),
  ('water_purifier',    'Water Purifier',      'kitchen',       100),
  ('ro_water',          'RO Water',            'kitchen',       110),
  ('solar_water_heater','Solar Water Heater',  'heating',       120),
  ('power_backup',      'Power Backup',        'smart_home',    130),
  ('ev_charger',        'EV Charger',          'parking',       140),
  ('bbq',               'BBQ',                 'outdoor',       150),
  ('private_pool',      'Private Pool',        'outdoor',       160),
  ('jacuzzi',           'Jacuzzi',             'bathroom',      170),
  ('garden',            'Garden',              'outdoor',       180),
  ('workspace',         'Workspace',           'workspace',     190),
  ('baby_cot',          'Baby Cot',            'family',        200),
  ('high_chair',        'High Chair',          'family',        210),
  ('iron',              'Iron',                'laundry',       220),
  ('hair_dryer',        'Hair Dryer',          'bathroom',      230),
  ('first_aid_kit',     'First Aid Kit',       'safety',        240),
  ('fire_extinguisher', 'Fire Extinguisher',   'safety',        250),
  ('cctv',              'CCTV',                'safety',        260),
  ('smart_lock',        'Smart Lock',          'smart_home',    270),
  ('touch_switches',    'Touch Switches',      'smart_home',    280)
on conflict (slug) do nothing;

insert into public.utility_types (slug, name) values
  ('electricity',     'Electricity'),
  ('water',           'Water'),
  ('gas',             'Gas'),
  ('internet',        'Internet'),
  ('association_fee', 'Association Fee')
on conflict (slug) do nothing;

-- Granular CRUD-level permissions for the Property module — designed in
-- docs/AUTH_RBAC_ARCHITECTURE.md §3.6 as "safe to apply immediately" and
-- applied now because this module is the first real consumer. The coarse
-- `manage_properties` permission stays (existing RLS write policies above
-- use it) — these granular ones are additive, for finer-grained future UI
-- gating (e.g. hide "Delete" but show "Edit"), per the same migration plan
-- already documented.
insert into public.permissions (key, name, description, category) values
  ('view_properties',  'View Properties',  'View the property list and details.',        'properties'),
  ('create_property',  'Create Property',  'Create new property records.',               'properties'),
  ('edit_property',    'Edit Property',    'Edit existing property records.',            'properties'),
  ('delete_property',  'Delete Property',  'Soft-delete a property record.',              'properties'),
  ('archive_property', 'Archive Property', 'Archive a property (status change only).',    'properties')
on conflict (key) do nothing;

with grants (role_slug, permission_key) as (
  values
    ('super_admin', 'view_properties'), ('super_admin', 'create_property'),
    ('super_admin', 'edit_property'), ('super_admin', 'delete_property'), ('super_admin', 'archive_property'),
    ('operations_manager', 'view_properties'), ('operations_manager', 'create_property'),
    ('operations_manager', 'edit_property'), ('operations_manager', 'archive_property'),
    ('property_manager', 'view_properties'), ('property_manager', 'edit_property'),
    ('property_owner', 'view_properties'),
    ('investor', 'view_properties')
)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.key = g.permission_key
on conflict (role_id, permission_id) do nothing;
