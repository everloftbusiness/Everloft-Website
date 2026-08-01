-- Expands amenity_master from the original 28-item/15-category seed to the
-- full ~200-item/15-category list from
-- docs/PROPERTY_SETUP_DASHBOARD_V2_IMPROVEMENTS.md §6. Additive, not a
-- replace: 7 real property_amenities rows already reference the original
-- seed (verified before writing this), so old rows are kept, not deleted.
-- The category check constraint is widened to the UNION of old + new
-- category slugs for exactly that reason — some original items (wifi,
-- smart_tv, workspace, iron, first_aid_kit, ...) collide by slug with the
-- new list and are skipped via ON CONFLICT DO NOTHING, staying under their
-- original category rather than being recategorized. Cosmetic only, zero
-- data loss.

alter table public.amenity_master drop constraint amenity_master_category_check;
alter table public.amenity_master add constraint amenity_master_category_check check (category in (
  -- original 15
  'internet', 'entertainment', 'kitchen', 'bathroom', 'bedroom', 'safety',
  'family', 'accessibility', 'outdoor', 'parking', 'heating', 'cooling',
  'laundry', 'workspace', 'smart_home',
  -- new 15
  'essentials', 'kitchen_dining', 'internet_office', 'heating_cooling',
  'safety_security', 'parking_building', 'guest_services', 'pet_friendly',
  'views_location'
));

insert into public.amenity_master (slug, name, category, sort_order) values
  -- 1. Essentials
  ('high_speed_wifi', 'High-speed Wi-Fi', 'essentials', 1000),
  ('tv', 'TV', 'essentials', 1010),
  ('air_conditioning', 'Air conditioning', 'essentials', 1020),
  ('ceiling_fan', 'Ceiling fan', 'essentials', 1030),
  ('portable_fan', 'Portable fan', 'essentials', 1040),
  ('heating', 'Heating', 'essentials', 1050),
  ('clothes_drying_rack', 'Clothes drying rack', 'essentials', 1060),
  ('hangers', 'Hangers', 'essentials', 1070),
  ('bed_linens', 'Bed linens', 'essentials', 1080),
  ('extra_pillows_blankets', 'Extra pillows & blankets', 'essentials', 1090),
  ('blackout_curtains', 'Blackout curtains', 'essentials', 1100),
  ('mosquito_repellent', 'Mosquito repellent', 'essentials', 1110),

  -- 2. Bathroom
  ('hot_water', 'Hot water', 'bathroom', 2000),
  ('shower', 'Shower', 'bathroom', 2010),
  ('bathtub', 'Bathtub', 'bathroom', 2020),
  ('toilet', 'Toilet', 'bathroom', 2030),
  ('bidet', 'Bidet', 'bathroom', 2040),
  ('shampoo', 'Shampoo', 'bathroom', 2050),
  ('conditioner', 'Conditioner', 'bathroom', 2060),
  ('body_soap', 'Body soap', 'bathroom', 2070),
  ('hand_soap', 'Hand soap', 'bathroom', 2080),
  ('toilet_paper', 'Toilet paper', 'bathroom', 2090),
  ('towels', 'Towels', 'bathroom', 2100),
  ('cleaning_products', 'Cleaning products', 'bathroom', 2110),

  -- 3. Bedroom
  ('king_bed', 'King bed', 'bedroom', 3000),
  ('queen_bed', 'Queen bed', 'bedroom', 3010),
  ('double_bed', 'Double bed', 'bedroom', 3020),
  ('single_bed', 'Single bed', 'bedroom', 3030),
  ('sofa_bed', 'Sofa bed', 'bedroom', 3040),
  ('floor_mattress', 'Floor mattress', 'bedroom', 3050),
  ('crib', 'Crib', 'bedroom', 3060),
  ('travel_cot', 'Travel cot', 'bedroom', 3070),
  ('wardrobe', 'Wardrobe', 'bedroom', 3080),
  ('nightstand', 'Nightstand', 'bedroom', 3090),
  ('reading_lamp', 'Reading lamp', 'bedroom', 3100),

  -- 4. Kitchen & Dining
  ('full_kitchen', 'Full kitchen', 'kitchen_dining', 4000),
  ('kitchenette', 'Kitchenette', 'kitchen_dining', 4010),
  ('freezer', 'Freezer', 'kitchen_dining', 4020),
  ('gas_stove', 'Gas stove', 'kitchen_dining', 4030),
  ('lpg_gas_stove', 'LPG gas stove', 'kitchen_dining', 4040),
  ('induction_cooktop', 'Induction cooktop', 'kitchen_dining', 4050),
  ('oven', 'Oven', 'kitchen_dining', 4060),
  ('toaster', 'Toaster', 'kitchen_dining', 4070),
  ('rice_cooker', 'Rice cooker', 'kitchen_dining', 4080),
  ('electric_kettle', 'Electric kettle', 'kitchen_dining', 4090),
  ('coffee_maker', 'Coffee maker', 'kitchen_dining', 4100),
  ('mixer_blender', 'Mixer / Blender', 'kitchen_dining', 4110),
  ('mixer_grinder', 'Mixer grinder', 'kitchen_dining', 4120),
  ('drinking_water', 'Drinking water', 'kitchen_dining', 4130),
  ('cookware', 'Cookware', 'kitchen_dining', 4140),
  ('frying_pan', 'Frying pan', 'kitchen_dining', 4150),
  ('pressure_cooker', 'Pressure cooker', 'kitchen_dining', 4160),
  ('indian_cooking_utensils', 'Indian cooking utensils', 'kitchen_dining', 4170),
  ('tawa', 'Tawa', 'kitchen_dining', 4180),
  ('plates', 'Plates', 'kitchen_dining', 4190),
  ('bowls', 'Bowls', 'kitchen_dining', 4200),
  ('cups', 'Cups', 'kitchen_dining', 4210),
  ('wine_glasses', 'Wine glasses', 'kitchen_dining', 4220),
  ('cutlery', 'Cutlery', 'kitchen_dining', 4230),
  ('dining_table', 'Dining table', 'kitchen_dining', 4240),
  ('tea_coffee_starter_kit', 'Tea & coffee starter kit', 'kitchen_dining', 4250),
  ('basic_spices', 'Basic spices', 'kitchen_dining', 4260),

  -- 5. Internet & Office
  ('ethernet', 'Ethernet', 'internet_office', 5000),
  ('printer', 'Printer', 'internet_office', 5010),
  ('monitor', 'Monitor', 'internet_office', 5020),
  ('ups', 'UPS', 'internet_office', 5030),
  ('inverter_backup', 'Inverter backup', 'internet_office', 5040),

  -- 6. Entertainment
  ('cable_tv', 'Cable TV', 'entertainment', 6000),
  ('amazon_prime_video', 'Amazon Prime Video', 'entertainment', 6010),
  ('disney_hotstar', 'Disney+ Hotstar', 'entertainment', 6020),
  ('bluetooth_speaker', 'Bluetooth speaker', 'entertainment', 6030),
  ('home_theatre', 'Home theatre', 'entertainment', 6040),
  ('board_games', 'Board games', 'entertainment', 6050),
  ('books', 'Books', 'entertainment', 6060),
  ('playstation', 'PlayStation', 'entertainment', 6070),
  ('xbox', 'Xbox', 'entertainment', 6080),
  ('pool_table', 'Pool table', 'entertainment', 6090),
  ('foosball', 'Foosball', 'entertainment', 6100),

  -- 7. Family
  ('family_friendly', 'Family friendly', 'family', 7000),
  ('baby_bath', 'Baby bath', 'family', 7010),
  ('childrens_books', 'Children''s books', 'family', 7020),
  ('childrens_toys', 'Children''s toys', 'family', 7030),
  ('childrens_dinnerware', 'Children''s dinnerware', 'family', 7040),
  ('stair_gates', 'Stair gates', 'family', 7050),
  ('outlet_covers', 'Outlet covers', 'family', 7060),

  -- 8. Heating & Cooling
  ('heater', 'Heater', 'heating_cooling', 8000),
  ('fireplace', 'Fireplace', 'heating_cooling', 8010),
  ('indoor_fireplace', 'Indoor fireplace', 'heating_cooling', 8020),

  -- 9. Safety & Security
  ('smoke_alarm', 'Smoke alarm', 'safety_security', 9000),
  ('carbon_monoxide_alarm', 'Carbon monoxide alarm', 'safety_security', 9010),
  ('cctv_outdoor', 'CCTV (Outdoor)', 'safety_security', 9020),
  ('cctv_entrance', 'CCTV at entrance', 'safety_security', 9030),
  ('security_alarm', 'Security alarm', 'safety_security', 9040),
  ('digital_door_lock', 'Digital door lock', 'safety_security', 9050),
  ('safe', 'Safe', 'safety_security', 9060),
  ('emergency_contact_list', 'Emergency contact list', 'safety_security', 9070),
  ('medical_kit', 'Medical kit', 'safety_security', 9080),

  -- 10. Outdoor
  ('balcony', 'Balcony', 'outdoor', 10000),
  ('balcony_seating', 'Balcony seating', 'outdoor', 10010),
  ('patio', 'Patio', 'outdoor', 10020),
  ('backyard', 'Backyard', 'outdoor', 10030),
  ('terrace', 'Terrace', 'outdoor', 10040),
  ('bbq_grill', 'BBQ grill', 'outdoor', 10050),
  ('fire_pit', 'Fire pit', 'outdoor', 10060),
  ('outdoor_dining_area', 'Outdoor dining area', 'outdoor', 10070),
  ('outdoor_furniture', 'Outdoor furniture', 'outdoor', 10080),
  ('swing', 'Swing', 'outdoor', 10090),
  ('hammock', 'Hammock', 'outdoor', 10100),

  -- 11. Parking & Building Facilities
  ('free_parking', 'Free parking', 'parking_building', 11000),
  ('paid_parking', 'Paid parking', 'parking_building', 11010),
  ('car_parking', 'Car parking', 'parking_building', 11020),
  ('elevator', 'Elevator', 'parking_building', 11030),
  ('lift', 'Lift', 'parking_building', 11040),
  ('swimming_pool', 'Swimming pool', 'parking_building', 11050),
  ('shared_pool', 'Shared pool', 'parking_building', 11060),
  ('hot_tub', 'Hot tub', 'parking_building', 11070),
  ('gym', 'Gym', 'parking_building', 11080),
  ('sauna', 'Sauna', 'parking_building', 11090),
  ('steam_room', 'Steam room', 'parking_building', 11100),

  -- 12. Accessibility
  ('step_free_entrance', 'Step-free entrance', 'accessibility', 12000),
  ('wide_doorway', 'Wide doorway', 'accessibility', 12010),
  ('elevator_access', 'Elevator access', 'accessibility', 12020),
  ('accessible_bathroom', 'Accessible bathroom', 'accessibility', 12030),
  ('roll_in_shower', 'Roll-in shower', 'accessibility', 12040),
  ('shower_chair', 'Shower chair', 'accessibility', 12050),
  ('grab_bars', 'Grab bars', 'accessibility', 12060),
  ('accessible_parking', 'Accessible parking', 'accessibility', 12070),
  ('well_lit_entrance', 'Well-lit entrance', 'accessibility', 12080),

  -- 13. Guest Services
  ('self_check_in', 'Self check-in', 'guest_services', 13000),
  ('lockbox', 'Lockbox', 'guest_services', 13010),
  ('host_greeting', 'Host greeting', 'guest_services', 13020),
  ('luggage_drop_off', 'Luggage drop-off', 'guest_services', 13030),
  ('housekeeping', 'Housekeeping', 'guest_services', 13040),
  ('daily_housekeeping', 'Daily housekeeping', 'guest_services', 13050),
  ('long_term_stays_allowed', 'Long-term stays allowed', 'guest_services', 13060),
  ('cleaning_during_stay', 'Cleaning during stay', 'guest_services', 13070),
  ('breakfast', 'Breakfast', 'guest_services', 13080),
  ('room_service', 'Room service', 'guest_services', 13090),
  ('airport_pickup', 'Airport pickup', 'guest_services', 13100),
  ('caretaker', 'Caretaker', 'guest_services', 13110),
  ('caretaker_on_call', 'Caretaker on call', 'guest_services', 13120),
  ('concierge', 'Concierge', 'guest_services', 13130),
  ('local_guidebook', 'Local guidebook', 'guest_services', 13140),

  -- 14. Pet Friendly
  ('pets_allowed', 'Pets allowed', 'pet_friendly', 14000),
  ('pet_bowls', 'Pet bowls', 'pet_friendly', 14010),
  ('pet_bed', 'Pet bed', 'pet_friendly', 14020),
  ('fenced_yard', 'Fenced yard', 'pet_friendly', 14030),

  -- 15. Views & Location
  ('mountain_view', 'Mountain view', 'views_location', 15000),
  ('beach_view', 'Beach view', 'views_location', 15010),
  ('beachfront', 'Beachfront', 'views_location', 15020),
  ('lake_view', 'Lake view', 'views_location', 15030),
  ('river_view', 'River view', 'views_location', 15040),
  ('garden_view', 'Garden view', 'views_location', 15050),
  ('city_skyline_view', 'City skyline view', 'views_location', 15060),
  ('ski_in_ski_out', 'Ski-in / Ski-out', 'views_location', 15070),
  ('resort_access', 'Resort access', 'views_location', 15080),
  ('private_entrance', 'Private entrance', 'views_location', 15090)
on conflict (slug) do nothing;
