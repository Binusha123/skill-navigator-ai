
-- ============ ENUM ============
create type public.app_role as enum ('admin', 'user');

-- ============ updated_at helper ============
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Now register the signup trigger (after user_roles exists)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ ASSESSMENTS ============
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Assessment',
  resume_text text,
  jd_text text,
  resume_file_path text,
  status text not null default 'draft',
  job_readiness_score int,
  insight text,
  resume_data jsonb,
  jd_data jsonb,
  skill_mapping jsonb,
  gap_analysis jsonb,
  skill_confidence jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_assessments_user_id on public.assessments(user_id);
create index idx_assessments_created_at on public.assessments(created_at desc);

alter table public.assessments enable row level security;

create policy "Users can view their own assessments"
  on public.assessments for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Users can insert their own assessments"
  on public.assessments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own assessments"
  on public.assessments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own assessments"
  on public.assessments for delete
  using (auth.uid() = user_id);

create trigger update_assessments_updated_at
  before update on public.assessments
  for each row execute function public.update_updated_at_column();

-- ============ ASSESSMENT QUESTIONS ============
create table public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  skill text not null,
  question text not null,
  answer text,
  score int,
  required_score int,
  feedback text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_questions_assessment_id on public.assessment_questions(assessment_id);

alter table public.assessment_questions enable row level security;

create policy "Users can view their own questions"
  on public.assessment_questions for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Users can insert their own questions"
  on public.assessment_questions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own questions"
  on public.assessment_questions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own questions"
  on public.assessment_questions for delete
  using (auth.uid() = user_id);

-- ============ LEARNING PLAN WEEKS ============
create table public.learning_plan_weeks (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week int not null,
  focus text not null,
  tasks jsonb not null default '[]'::jsonb,
  resources jsonb not null default '[]'::jsonb,
  hours int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_weeks_assessment_id on public.learning_plan_weeks(assessment_id);

alter table public.learning_plan_weeks enable row level security;

create policy "Users can view their own learning weeks"
  on public.learning_plan_weeks for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Users can insert their own learning weeks"
  on public.learning_plan_weeks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own learning weeks"
  on public.learning_plan_weeks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own learning weeks"
  on public.learning_plan_weeks for delete
  using (auth.uid() = user_id);

-- ============ STORAGE: resumes bucket ============
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "Users can view their own resumes"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(), 'admin'))
  );

create policy "Users can upload their own resumes"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own resumes"
  on storage.objects for update
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own resumes"
  on storage.objects for delete
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
