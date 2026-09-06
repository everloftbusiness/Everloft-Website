alter table public.property_integrations
  add column if not exists calendar_color text;

update public.property_integrations
set calendar_color = case channel
  when 'airbnb' then '#FF5A5F'
  when 'booking_com' then '#003580'
  when 'makemytrip' then '#E34F4F'
  when 'agoda' then '#7C3AED'
  when 'vrbo' then '#2563EB'
  else '#047857'
end
where calendar_color is null;
