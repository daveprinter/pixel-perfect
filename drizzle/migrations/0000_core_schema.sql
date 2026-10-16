
create type public.app_role as enum ('admin','staff','user');
create type public.booking_status as enum ('draft','awaiting_quotation','awaiting_deposit','confirmed','scheduled','in_progress','completed','cancelled','refunded');
create type public.listing_status as enum ('available','reserved','occupied','unavailable');

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  referral_code text unique not null default upper(substr(md5(random()::text),1,8)),
  referred_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public
as $$ select public.has_role(auth.uid(),'admin') $$;

create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- prevent users changing referral fields
create or replace function public.protect_profile_fields() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not public.is_admin() and auth.uid() is not null then
    new.referral_code := old.referral_code;
    new.referred_by := old.referred_by;
  end if;
  return new;
end $$;
create trigger trg_protect_profile before update on public.profiles for each row execute function public.protect_profile_fields();

-- admin setup codes (hashed, service role only)
create table public.admin_setup_codes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  code_hash text not null unique,
  revoked boolean not null default false,
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
grant all on public.admin_setup_codes to service_role;
alter table public.admin_setup_codes enable row level security;
insert into public.admin_setup_codes(label, code_hash) values
 ('Initial code 1','51d1cfa9611ae564dad2dc625fe5f358ef4eaef2939081895749af450d983ee6'),
 ('Initial code 2','09e7fc3d393c08bb0c58937fca8a60de627a50a64fcb26d1528f2f73f7bef223'),
 ('Initial code 3','db49075133a659a2436316f7a167af6c50075706f6eb8bdcb31dc6a5723fc2f7');

-- settings (public read: pricing, terms, contacts)
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
grant select on public.app_settings to anon, authenticated;
grant insert, update, delete on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "settings read" on public.app_settings for select to anon, authenticated using (true);
create policy "settings admin write" on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.app_settings(key, value) values
('pricing', '{
  "deposit_percent": 30,
  "base_fee": 500,
  "routes": {
    "same": 800,
    "SEKU|Kwa Vonza (KU)": 1000, "SEKU|Kwa Vonza town": 1000, "Kwa Vonza (KU)|Kwa Vonza town": 800,
    "SEKU|Kitui town": 3000, "Kwa Vonza (KU)|Kitui town": 3000, "Kwa Vonza town|Kitui town": 3000,
    "SEKU|Wote town": 4500, "Kwa Vonza (KU)|Wote town": 4500, "Kwa Vonza town|Wote town": 4500,
    "Kitui town|Wote town": 6000
  },
  "items": {
    "bed": 400, "mattress": 200, "sofa": 500, "gas_cylinder": 150, "television": 250, "tv_mounting": 800,
    "wardrobe": 500, "table_chairs": 300, "fridge": 700, "washing_machine": 700, "kitchen": 300, "boxes": 100, "other": 0
  },
  "per_floor": 100
}'),
('terms', '{
  "moving": "A booking deposit secures your moving date. Cancel 24+ hours before pickup for a full deposit refund; later cancellations forfeit the deposit. The balance is paid on completion.",
  "placement": "Reservation deposit holds the room for you and is credited to your rent. The landlord deposit is refundable by the landlord at move-out per their terms. The company service fee covers our sourcing and is non-refundable once you move in.",
  "referral": "Earn a cash bonus when someone you refer completes and pays for an eligible service. Self-referrals and duplicate accounts are not eligible. Bonuses are reviewed by an administrator before approval and paid once you reach the payout threshold."
}'),
('referral', '{"bonus_amount": 200, "payout_threshold": 500, "qualifying": ["moving","placement"]}'),
('contacts', '{"phone":"+254700000000","whatsapp":"254700000000","email":"hello@homeshift.co.ke","facebook":"https://facebook.com","instagram":"https://instagram.com","tiktok":"https://tiktok.com","youtube":"https://youtube.com","website":""}');

-- selection lists
create table public.place_options (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('kwavonza','seku')),
  name text not null,
  active boolean not null default true,
  sort int not null default 0,
  unique (kind, name)
);
grant select on public.place_options to anon, authenticated;
grant insert, update, delete on public.place_options to authenticated;
grant all on public.place_options to service_role;
alter table public.place_options enable row level security;
create policy "places read" on public.place_options for select to anon, authenticated using (true);
create policy "places admin" on public.place_options for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.place_options(kind,name,sort) select 'kwavonza', n, i from unnest(array['Amani','Niles','Beach House','Kleenex','Orange House','Mizizi Plaza','Runda','Peter Clevers','California','Majibu 1','Majibu 2','Majibu 3','Delta','Ndeli','Ebenezer']) with ordinality as t(n,i);
insert into public.place_options(kind,name,sort) select 'seku', n, i from unnest(array['Elementaita','Victoria','Baringo','Yatta 2','Yatta 3','Turkana','Turkwel']) with ordinality as t(n,i);

-- listings (public customer-facing)
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  door_number text,
  accommodation_type text not null,
  furnishing text not null default 'vacant',
  household_items text[] not null default '{}',
  reservation_amount numeric not null default 0,
  landlord_deposit numeric not null default 0,
  service_fee numeric not null default 0,
  customer_price numeric not null,
  status listing_status not null default 'available',
  photos text[] not null default '{}',
  description text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;
grant all on public.listings to service_role;
alter table public.listings enable row level security;
create policy "listings public available" on public.listings for select to anon, authenticated using (status = 'available' or public.is_admin());
create policy "listings admin" on public.listings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- private cost records for listings
create table public.listing_costs (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  original_deposit numeric not null default 0,
  other_costs numeric not null default 0,
  notes text
);
grant select, insert, update, delete on public.listing_costs to authenticated;
grant all on public.listing_costs to service_role;
alter table public.listing_costs enable row level security;
create policy "costs admin" on public.listing_costs for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.placement_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  listing_id uuid references public.listings(id) on delete set null,
  phone text,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','placed','completed','rejected','cancelled')),
  agreed_price numeric,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.placement_requests to authenticated;
grant all on public.placement_requests to service_role;
alter table public.placement_requests enable row level security;
create policy "pr own read" on public.placement_requests for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "pr own insert" on public.placement_requests for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "pr admin update" on public.placement_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- bookings (inserted via server function with server-side quote)
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null default ('MV-' || upper(substr(md5(random()::text),1,6))),
  user_id uuid not null,
  origin text not null,
  origin_detail text,
  destination text not null,
  destination_detail text,
  items jsonb not null default '[]',
  floor_level int not null default 0,
  special_handling text,
  move_date date,
  move_time text,
  phone text not null,
  notes text,
  quote_breakdown jsonb not null default '[]',
  quote_total numeric,
  deposit_required numeric,
  needs_manual_quote boolean not null default false,
  status booking_status not null default 'awaiting_deposit',
  assigned_team text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "bookings own read" on public.bookings for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "bookings admin update" on public.bookings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- payments: created/verified only server-side or by admin
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  booking_id uuid references public.bookings(id) on delete set null,
  placement_id uuid references public.placement_requests(id) on delete set null,
  kind text not null default 'deposit' check (kind in ('deposit','balance','placement','refund')),
  amount numeric not null check (amount > 0),
  method text not null default 'mpesa',
  provider_ref text,
  status text not null default 'pending' check (status in ('pending','verified','failed','refunded')),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, update on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "payments own read" on public.payments for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "payments admin update" on public.payments for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  placement_id uuid references public.placement_requests(id) on delete set null,
  category text not null check (category in ('transport','labour','fuel','listing_deposit','advertising','other')),
  amount numeric not null check (amount >= 0),
  description text,
  spent_on date not null default current_date,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.expenses to authenticated;
grant all on public.expenses to service_role;
alter table public.expenses enable row level security;
create policy "expenses admin" on public.expenses for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- referrals
create table public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null,
  referred_id uuid not null,
  booking_id uuid unique references public.bookings(id) on delete set null,
  placement_id uuid unique references public.placement_requests(id) on delete set null,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending','approved','paid','rejected')),
  created_at timestamptz not null default now()
);
grant select, update on public.referral_rewards to authenticated;
grant all on public.referral_rewards to service_role;
alter table public.referral_rewards enable row level security;
create policy "rewards own read" on public.referral_rewards for select to authenticated using (referrer_id = auth.uid() or public.is_admin());
create policy "rewards admin update" on public.referral_rewards for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.referral_payouts (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null,
  amount numeric not null check (amount > 0),
  method text not null default 'mpesa',
  reference text,
  created_at timestamptz not null default now()
);
grant select, insert on public.referral_payouts to authenticated;
grant all on public.referral_payouts to service_role;
alter table public.referral_payouts enable row level security;
create policy "payouts own read" on public.referral_payouts for select to authenticated using (referrer_id = auth.uid() or public.is_admin());
create policy "payouts admin insert" on public.referral_payouts for insert to authenticated with check (public.is_admin());

-- support
create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  topic text not null default 'question',
  subject text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending','in_progress','resolved')),
  assigned_to text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.support_messages to authenticated;
grant all on public.support_messages to service_role;
alter table public.support_messages enable row level security;
create policy "msg own read" on public.support_messages for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "msg own insert" on public.support_messages for insert to authenticated with check (user_id = auth.uid() and status='pending');
create policy "msg admin update" on public.support_messages for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.support_messages(id) on delete cascade,
  author_id uuid not null,
  is_admin boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.message_replies to authenticated;
grant all on public.message_replies to service_role;
alter table public.message_replies enable row level security;
create policy "replies read" on public.message_replies for select to authenticated using (public.is_admin() or exists (select 1 from public.support_messages m where m.id = message_id and m.user_id = auth.uid()));
create policy "replies insert" on public.message_replies for insert to authenticated with check (author_id = auth.uid() and is_admin = public.is_admin() and (public.is_admin() or exists (select 1 from public.support_messages m where m.id = message_id and m.user_id = auth.uid())));

-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notif own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notif own update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ad campaigns
create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform text not null,
  target_location text,
  budget numeric not null default 0,
  spend numeric not null default 0,
  start_date date,
  end_date date,
  impressions int not null default 0,
  clicks int not null default 0,
  leads int not null default 0,
  bookings int not null default 0,
  conversions int not null default 0,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ad_campaigns to authenticated;
grant all on public.ad_campaigns to service_role;
alter table public.ad_campaigns enable row level security;
create policy "ads admin" on public.ad_campaigns for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- audit log
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "audit admin read" on public.audit_log for select to authenticated using (public.is_admin());
create policy "audit admin insert" on public.audit_log for insert to authenticated with check (public.is_admin() and actor_id = auth.uid());

-- new user handler with referral attribution (self-referral impossible: new user has no code yet)
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare ref uuid;
begin
  select id into ref from public.profiles where referral_code = upper(nullif(new.raw_user_meta_data->>'ref',''));
  insert into public.profiles(id, full_name, phone, referred_by)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', ref);
  insert into public.user_roles(user_id, role) values (new.id, 'user');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- booking status notifications + referral reward on completion
create or replace function public.on_booking_status() returns trigger language plpgsql security definer set search_path = public as $$
declare ref uuid; bonus numeric; paid boolean;
begin
  new.updated_at := now();
  if new.status is distinct from old.status then
    insert into public.notifications(user_id,title,body) values (new.user_id, 'Booking '||new.reference||' updated', 'Status is now '||replace(new.status::text,'_',' '));
    if new.status = 'completed' then
      select referred_by into ref from public.profiles where id = new.user_id;
      select exists(select 1 from public.payments where booking_id=new.id and status='verified') into paid;
      if ref is not null and ref <> new.user_id and paid then
        select coalesce((value->>'bonus_amount')::numeric,0) into bonus from public.app_settings where key='referral';
        if bonus > 0 and not exists (select 1 from public.referral_rewards where referred_id = new.user_id) then
          insert into public.referral_rewards(referrer_id, referred_id, booking_id, amount) values (ref, new.user_id, new.id, bonus)
          on conflict (booking_id) do nothing;
        end if;
      end if;
    end if;
  elsif new.move_date is distinct from old.move_date then
    insert into public.notifications(user_id,title,body) values (new.user_id, 'Moving date changed', 'Booking '||new.reference||' is now on '||coalesce(new.move_date::text,'TBD'));
  end if;
  return new;
end $$;
create trigger trg_booking_status before update on public.bookings for each row execute function public.on_booking_status();

create or replace function public.on_payment_verified() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'verified' and old.status <> 'verified' then
    new.verified_at := now();
    insert into public.notifications(user_id,title,body) values (new.user_id,'Payment confirmed','We received KES '||new.amount||'. Your receipt is in your dashboard.');
    if new.booking_id is not null and new.kind='deposit' then
      update public.bookings set status='confirmed' where id=new.booking_id and status='awaiting_deposit';
    end if;
  end if;
  return new;
end $$;
create trigger trg_payment_verified before update on public.payments for each row execute function public.on_payment_verified();

-- sample data
insert into public.listings(name,location,door_number,accommodation_type,furnishing,household_items,reservation_amount,landlord_deposit,service_fee,customer_price,status,description,is_sample) values
('Amani Apartments (Sample)','Kwa Vonza','B4','Bedsitter','basic',array['Bed','Mattress','Gas cylinder'],1000,4500,1500,5000,'available','Sample listing. Quiet bedsitter 5 minutes from KU Kwa Vonza gate, tiled floor, water included.',true),
('Mizizi Plaza (Sample)','Kwa Vonza','12','Single room','vacant',array[]::text[],500,3000,1000,3500,'available','Sample listing. Bright single room with shared washroom, near the market.',true),
('Runda Court (Sample)','Kwa Vonza','A2','Bedsitter','vacant',array[]::text[],1000,5000,1500,5500,'available','Sample listing. Spacious bedsitter with balcony and reliable water.',true),
('Kitui Heights (Sample)','Kitui town','7','One bedroom','basic',array['Bed','Mattress'],2000,8000,2000,9000,'available','Sample listing. One bedroom near Kitui CBD with parking.',true),
('Wote Garden Rooms (Sample)','Wote town','3','Single room','basic',array['Bed','Mattress','Gas cylinder'],500,3500,1000,4000,'available','Sample listing. Furnished single room close to town stage.',true),
('Delta Hostel (Sample)','Kwa Vonza','9','Fully vacant room','vacant',array[]::text[],500,2500,800,3000,'occupied','Sample listing (occupied - hidden publicly).',true);

insert into public.ad_campaigns(name,platform,target_location,budget,spend,start_date,end_date,impressions,clicks,leads,bookings,conversions,is_sample) values
('Back to campus (Sample)','Facebook & Instagram','Kwa Vonza / SEKU',10000,7500,current_date-30,current_date-5,42000,1300,85,22,18,true),
('Move day TikTok (Sample)','TikTok','Kitui',6000,5200,current_date-20,current_date,61000,2100,60,12,10,true);
