-- ============================================================================
-- extensive-signups initial schema
-- ============================================================================

-- Members: known team roster. One row per Google-authenticated user.
create table public.members (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique references auth.users(id) on delete cascade,
  name            text not null,
  email           text not null unique,
  phone           text,
  role            text not null default 'member' check (role in ('admin', 'member')),
  active          boolean not null default true,
  reminder_hours  integer[] not null default '{48, 24}',  -- email me 48h and 24h before
  created_at      timestamptz not null default now()
);

create index members_email_idx on public.members(email);
create index members_active_idx on public.members(active);

-- Events: a signup period covering one or more weekends.
create table public.events (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  created_by    uuid not null references public.members(id),
  invites_sent_at timestamptz,
  gap_alert_hours integer not null default 72,  -- alert N hours before unfilled Mass
  status        text not null default 'open' check (status in ('draft', 'open', 'closed')),
  created_at    timestamptz not null default now()
);

create index events_status_idx on public.events(status);

-- Gap alert recipients (Matt + others) — many per event
create table public.event_alert_recipients (
  event_id  uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  primary key (event_id, member_id)
);

-- Masses: individual Mass times within an event.
create table public.masses (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  mass_date   date not null,
  start_time  time not null,
  label       text not null,         -- "Saturday 4:00pm" — friendly label
  location    text not null default 'SJA',
  display_order integer not null default 0,
  created_at  timestamptz not null default now()
);

create index masses_event_idx on public.masses(event_id);
create index masses_date_idx on public.masses(mass_date);

-- Slots: roles within each Mass (Team Lead × 1, Medic × 1, Team Member × N).
create table public.slots (
  id            uuid primary key default gen_random_uuid(),
  mass_id       uuid not null references public.masses(id) on delete cascade,
  role          text not null,        -- "Team Lead", "Medic", "Team Member"
  capacity      integer not null default 1 check (capacity >= 1),
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create index slots_mass_idx on public.slots(mass_id);

-- Signups: who's filling which slot.
create table public.signups (
  id            uuid primary key default gen_random_uuid(),
  slot_id       uuid not null references public.slots(id) on delete cascade,
  member_id     uuid not null references public.members(id) on delete cascade,
  display_name  text,                 -- override (e.g. "My son Jake"); null = use member.name
  comment       text,
  status        text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  cancel_token  uuid not null default gen_random_uuid(),  -- for one-click cancel-my-spot links
  signed_up_at  timestamptz not null default now(),
  cancelled_at  timestamptz
);

create index signups_slot_idx on public.signups(slot_id);
create index signups_member_idx on public.signups(member_id);
create index signups_status_idx on public.signups(status);

-- One member can only have one ACTIVE signup per slot (re-signup after cancel ok).
create unique index signups_one_confirmed_per_slot_per_member
  on public.signups(slot_id, member_id)
  where status = 'confirmed';

-- Mass templates: admins can save reusable Mass schedules ("Standard Weekend").
create table public.mass_templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,        -- "Standard Weekend"
  created_by   uuid not null references public.members(id),
  created_at   timestamptz not null default now()
);

create table public.mass_template_items (
  id            uuid primary key default gen_random_uuid(),
  template_id   uuid not null references public.mass_templates(id) on delete cascade,
  day_offset    integer not null,      -- 0 = Saturday, 1 = Sunday (from event start date)
  start_time    time not null,
  label         text not null,
  location      text not null default 'SJA',
  display_order integer not null default 0
);

create table public.mass_template_slots (
  id              uuid primary key default gen_random_uuid(),
  template_item_id uuid not null references public.mass_template_items(id) on delete cascade,
  role            text not null,
  capacity        integer not null default 1,
  display_order   integer not null default 0
);

-- ============================================================================
-- Row Level Security policies
-- ============================================================================
-- Strategy:
--   * Authenticated members can read everything (events, masses, slots, signups)
--   * Members can insert/update/delete only THEIR OWN signups
--   * Only admins can create/modify events, masses, slots, templates
--   * Only admins can manage the member roster

alter table public.members              enable row level security;
alter table public.events               enable row level security;
alter table public.event_alert_recipients enable row level security;
alter table public.masses               enable row level security;
alter table public.slots                enable row level security;
alter table public.signups              enable row level security;
alter table public.mass_templates       enable row level security;
alter table public.mass_template_items  enable row level security;
alter table public.mass_template_slots  enable row level security;

-- Helper: is the current auth user an admin member?
create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from public.members
    where auth_user_id = auth.uid()
      and role = 'admin'
      and active = true
  )
$$;

-- Helper: is the current auth user an active member?
create or replace function public.is_active_member() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from public.members
    where auth_user_id = auth.uid()
      and active = true
  )
$$;

-- Helper: get the current user's member.id
create or replace function public.current_member_id() returns uuid
language sql security definer stable as $$
  select id from public.members where auth_user_id = auth.uid() limit 1
$$;

-- MEMBERS table
create policy "active members can view roster"      on public.members for select  using (public.is_active_member());
create policy "members can update their own row"   on public.members for update  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid() and role = (select role from public.members where auth_user_id = auth.uid()));
create policy "admins can insert members"          on public.members for insert  with check (public.is_admin());
create policy "admins can delete members"          on public.members for delete  using (public.is_admin());

-- EVENTS table
create policy "active members can view events"     on public.events for select  using (public.is_active_member());
create policy "admins can manage events"           on public.events for all     using (public.is_admin()) with check (public.is_admin());

-- ALERT RECIPIENTS
create policy "active members can view recipients" on public.event_alert_recipients for select using (public.is_active_member());
create policy "admins can manage recipients"       on public.event_alert_recipients for all    using (public.is_admin()) with check (public.is_admin());

-- MASSES
create policy "active members can view masses"     on public.masses for select  using (public.is_active_member());
create policy "admins can manage masses"           on public.masses for all     using (public.is_admin()) with check (public.is_admin());

-- SLOTS
create policy "active members can view slots"      on public.slots for select  using (public.is_active_member());
create policy "admins can manage slots"            on public.slots for all     using (public.is_admin()) with check (public.is_admin());

-- SIGNUPS
create policy "active members can view signups"    on public.signups for select using (public.is_active_member());
create policy "members can insert their own signups" on public.signups for insert with check (member_id = public.current_member_id() and public.is_active_member());
create policy "members can update their own signups" on public.signups for update using (member_id = public.current_member_id()) with check (member_id = public.current_member_id());
create policy "admins can manage all signups"      on public.signups for all using (public.is_admin()) with check (public.is_admin());

-- TEMPLATES
create policy "active members can view templates"  on public.mass_templates for select  using (public.is_active_member());
create policy "admins can manage templates"        on public.mass_templates for all     using (public.is_admin()) with check (public.is_admin());

create policy "active members can view template items" on public.mass_template_items for select  using (public.is_active_member());
create policy "admins can manage template items"   on public.mass_template_items for all     using (public.is_admin()) with check (public.is_admin());

create policy "active members can view template slots" on public.mass_template_slots for select  using (public.is_active_member());
create policy "admins can manage template slots"   on public.mass_template_slots for all     using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Auto-create member row when a new user signs up via Supabase auth
-- ============================================================================
-- When someone signs in with Google for the first time, Supabase creates a
-- row in auth.users. We mirror that into our public.members table so we have
-- a place to track name/role/active.
--
-- IMPORTANT: this default-creates members as inactive. An admin must activate
-- them. This prevents random Google account holders from accessing the app
-- just because they hit the OAuth callback.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.members (auth_user_id, name, email, role, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'member',
    false  -- inactive by default; admin must activate
  )
  on conflict (email) do update
    set auth_user_id = new.id;  -- link existing roster entry to auth user
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
