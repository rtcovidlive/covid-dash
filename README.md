# covid-dash

This is the front-end code that powers [covidestim.org](https://covidestim.org). The original code is a fork of [rt.live](https://rt.live), with substantial modification to visualize county-level results.

It's built using Next.js; to run it, type:

`npm install` and then `npm run dev`

## Key files

```
components/
├── Grid.js                The grid system, useful if creating new displays
├── HeadTag.js             Where to go if you need something in the head tag
├── OverviewMap.js         A (messy) file used for all the mapping stuff, needs
                             a refactor
├── RTBase.js              Sets up API calls and does other init-config actions
├── RTFooter.js            Footer code
├── RTHeader.js            Header code
├── RTOverview.js          Basically the root node that all important
                             components descend from
├── RTSubareaChart.js      This and all following files are various wrappers
├── RTSubareaOverview.js     around the primary outcome charts used all over
├── StateR0Display.js        the front page.
├── StateRtChart.js
├── StateRtMiniDisplay.js
├── [...] Others omitted
```

```
config/
  URLs for CDNs, as well as important information on FIPS codes, state abbrs.
  Also contains `data.js`, which makes API calls to https://api.covidestim.org
public/
  This gets served as page root, so it's where favicons, media etc live
visualization/
  All d3 code lives here, and gets referneced by files in components/
```

## Static assets

The website requires two JSON files to run.

One file contains state-level timeseries results across several outcomes, 
and these data are used to render all of the state-level graphs displayed on 
the homepage.

The second file contains **weekly** county-level timeseries results across
several outcomes. These data are used only for the county-levle map shown at the
top of the homepage. Sending **weekly** results is a strategy to lower pageload
time.

Both of these files are gzipped [MessagePack][msgpack] files. MessagePack is a
serialization format that is more space-efficient than JSON.

Both of these files are stored in our S3 bucket, and they are generated overnight
by the model pipeline. The R scripts which generate the MessagePack files can be
found in `covidestim-sources/scripts` as `RtLiveConvert.R` (state-level file) and
`serialize.R` (county-level file).

## API

The Covidestim API is available at `https://api.covidestim.org`. It is backed by a
Postgres instance running on RDS. The API server itself is an instance of [PostgREST][postgrest],
running on AWS Fargate which has read-only access to the tables and views required
to service web clients. No insertions or deletions can be made through PostgREST - 
those operations are done by `psql` scripts run at the end of the pipeline.
PostgREST has slightly different syntax from other popular REST API servers.

### Example query

To fetch the most recently estimated R_t values for New Haven County, CT for dates after 
October 1st, perform an HTTP GET on the following URL:

```
https://api.covidestim.org/latest_results?fips=eq.09009&date=gt.2021-10-01&select=date,Rt
```

[msgpack]: https://msgpack.org/index.html
[postgrest]: https://postgrest.org/
