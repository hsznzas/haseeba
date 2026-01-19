-- Merge Morning/Evening Athkar into a twice-daily counter habit

-- Create or update combined habit for affected users
with habit_sources as (
  select
    user_id,
    min(order_index) as order_index,
    min(start_date) as start_date,
    bool_or(is_active) as is_active,
    bool_or(coalesce(require_reason, false)) as require_reason,
    bool_or(coalesce(affects_score, true)) as affects_score
  from habits
  where id in ('morning_athkar', 'evening_athkar')
  group by user_id
),
log_sources as (
  select
    user_id
  from habit_logs
  where habit_id in ('morning_athkar', 'evening_athkar')
  group by user_id
),
sources as (
  select
    hs.user_id,
    hs.order_index,
    hs.start_date,
    hs.is_active,
    hs.require_reason,
    hs.affects_score
  from habit_sources hs
  union
  select
    ls.user_id,
    120 as order_index,
    null as start_date,
    true as is_active,
    false as require_reason,
    true as affects_score
  from log_sources ls
)
insert into habits (
  user_id,
  id,
  name,
  name_ar,
  type,
  emoji,
  daily_target,
  preset_id,
  is_active,
  require_reason,
  affects_score,
  order_index,
  start_date
)
select
  user_id,
  'athkar_twice_daily' as id,
  'Athkar (AM/PM)' as name,
  'أذكار الصباح والمساء' as name_ar,
  'COUNTER' as type,
  null as emoji,
  2 as daily_target,
  'athkar_twice_daily' as preset_id,
  is_active,
  require_reason,
  affects_score,
  order_index,
  start_date
from sources
on conflict (user_id, id) do update
set
  name = excluded.name,
  name_ar = excluded.name_ar,
  type = excluded.type,
  daily_target = excluded.daily_target,
  preset_id = excluded.preset_id,
  is_active = excluded.is_active,
  require_reason = excluded.require_reason,
  affects_score = excluded.affects_score,
  order_index = excluded.order_index,
  start_date = excluded.start_date;

-- Combine logs into the twice-daily encoding
with morning as (
  select
    user_id,
    log_date,
    case
      when status = 'DONE' then 1
      when status = 'FAIL' then 2
      else 0
    end as am_state,
    reason as am_reason
  from habit_logs
  where habit_id = 'morning_athkar'
),
evening as (
  select
    user_id,
    log_date,
    case
      when status = 'DONE' then 1
      when status = 'FAIL' then 2
      else 0
    end as pm_state,
    reason as pm_reason
  from habit_logs
  where habit_id = 'evening_athkar'
),
combined as (
  select
    coalesce(morning.user_id, evening.user_id) as user_id,
    coalesce(morning.log_date, evening.log_date) as log_date,
    coalesce(morning.am_state, 0) as am_state,
    coalesce(evening.pm_state, 0) as pm_state,
    morning.am_reason,
    evening.pm_reason
  from morning
  full outer join evening
    on morning.user_id = evening.user_id
   and morning.log_date = evening.log_date
),
normalized as (
  select
    user_id,
    log_date,
    (am_state * 10 + pm_state) as value,
    case
      when am_state = 1 and pm_state = 1 then 'DONE'
      when am_state = 2 or pm_state = 2 then 'FAIL'
      else null
    end as status,
    coalesce(am_reason, pm_reason) as reason
  from combined
)
insert into habit_logs (
  user_id,
  id,
  habit_id,
  log_date,
  value,
  status,
  notes,
  reason
)
select
  user_id,
  concat('athkar_twice_daily-', log_date) as id,
  'athkar_twice_daily' as habit_id,
  log_date,
  value,
  status,
  null as notes,
  reason
from normalized
where value <> 0
on conflict (user_id, id) do update
set
  value = excluded.value,
  status = excluded.status,
  reason = excluded.reason;

-- Remove old habits/logs
delete from habit_logs
where habit_id in ('morning_athkar', 'evening_athkar');

delete from habits
where id in ('morning_athkar', 'evening_athkar');
