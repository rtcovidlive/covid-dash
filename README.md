# covid-dash

This is the front-end code that powers [covidestim.org](https://covidestim.org). The original code is a fork of [rt.live](https://rt.live), with substantial modification to visualize county-level results.

It's built using Next.js; to run it, do:

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
  URLs for CDNs, as well as important information on FIPS codes, state abbrs
public/
  This gets served at page root, so it's where favicons, media etc live
visualization/
  All d3 code lives here, and gets referneced by files in components/
```
