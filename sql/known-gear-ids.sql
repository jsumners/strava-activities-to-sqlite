select a.id
from gear a
where a.id in (
  select distinct b.gear_id
  from activities b
  where b.gear_id is not null
);
