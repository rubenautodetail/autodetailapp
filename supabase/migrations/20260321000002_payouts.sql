-- Payout records: one per contractor per weekly period
create table if not exists payouts (
    id                serial primary key,
    contractor_id     uuid not null references profiles(id) on delete cascade,
    period_start      date not null,
    period_end        date not null,
    total_bookings    integer not null default 0,
    gross_amount      numeric(10,2) not null default 0,
    platform_fee      numeric(10,2) not null default 0,
    contractor_amount numeric(10,2) not null default 0,
    status            text not null default 'pending' check (status in ('pending', 'paid')),
    payment_method    text check (payment_method in ('ach', 'zelle', 'check', 'cash')),
    paid_at           timestamptz,
    paid_by           uuid references profiles(id),
    notes             text,
    created_at        timestamptz not null default now(),
    unique (contractor_id, period_start, period_end)
);

-- Link bookings to their payout record once grouped
alter table bookings add column if not exists payout_id integer references payouts(id);

-- RLS: contractors can read their own payouts
alter table payouts enable row level security;

create policy "contractors read own payouts"
    on payouts for select
    using (contractor_id = auth.uid());

-- Service role has full access (admin API routes use createServiceClient)
