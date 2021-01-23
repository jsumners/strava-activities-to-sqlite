# SATS

This is a commandline tool for exporting [Strava](https://strava.com)
activities into a usable [SQLite3](https://sqlite.org) database. This is
useful when you want to issue queries like "how far did I ride in 2018 vs 2019".
Strava's normal data export comes in a CSV format that is difficult to parse
and has very difficult to work with dates (sans any information about timezone).
Their API, however, returns usuable.

![query example](/screenshot.png?raw=true)

## Setup And Usage

1. Create an [ngrok](https://ngrok.com/) tunnel to supply as the app domain
  to the Strava API
1. Create an app to access the API -- https://developers.strava.com/docs/getting-started/#account
1. Copy `.env.sample` to `.env` and adjust accordingly
1. Run the app `node sats.js ./my-strava-data.sqlite3`

Note: Strava imposes rate limiting -- https://developers.strava.com/docs/#rate-limiting

## Useful Queries

### Miles Ridden In A Year

```sql
select sum(distance) * 0.00062137 as miles_ridden
from activities
where
  datetime(start_date) > datetime('2018-12-31')
  and datetime(start_date) < datetime('2020-01-01')
  and lower(type) in ('ride', 'virtualride');
```

### Distance Ridden Per Gear

```sql
select
  b.brand_name,
  b.model_name,
  sum(a.distance) * 0.00062137 as miles_ridden
from activities a
join gear b
  on b.id = a.gear_id
group by a.gear_id;
```

### Distance Ridden On New Tires

```sql
select sum(distance) * 0.00062137 as miles_ridden
from activities
where
  datetime(start_date) > (
    select start_date
    from activities
    where description like '%[new tires]%'
      and start_date > datetime('2020-01-01')
  )
  and datetime(start_date) < datetime('2020-12-31')
  and lower(type) in ('ride');
```
