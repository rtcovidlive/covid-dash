# covid-dash

This is the front-end code that powers [rt.live](https://rt.live)

It's build using Next.js; to run it, do:

`npm install` and then `npm run dev`

It will default to the U.S., but you must specify a list of ACTIVE_COUNTRIES and a DEFAULT_COUNTRY in the environment variables at build time. Ex:

`DEFAULT_COUNTRY=us ACTIVE_COUNTRIES=us,demo npm run dev`
