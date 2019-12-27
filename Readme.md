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
