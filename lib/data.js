import useSWR from "swr";
import { fetcher, fetcherWithFilter } from "./fetcher";
import _ from "lodash";
import { timeDay } from "d3-time";
import { utcFormat } from "d3-time-format";

function useAllRunResults(fips) {
  const shouldFetch = fips && fips.length === 5;

  return useSWR(
    shouldFetch ? ["/all_runs", fips] : null,
    (endpoint, fips) => fetcher(endpoint, { fips: fips }),
    { refreshInterval: 0 }
  );
}

function useLatestCountyResults(fips) {
  const shouldFetch = fips && fips.length === 5;

  return useSWR(
    shouldFetch ? ["/latest_results", fips] : null,
    (endpoint, fips) => fetcher(endpoint, { fips: fips }),
    { refreshInterval: 0 }
  );
}

function useNeighboringCountyResults(fips, runDate) {
  const shouldFetch = fips && fips.length === 5;

  return useSWR(
    shouldFetch ? ["/neighbor_results", fips, runDate] : null,
    (endpoint, fips, runDate) =>
      fetcher(endpoint, { origin: fips, '"run.date"': runDate }),
    { refreshInterval: 0 }
  );
}

function useNeighboringStateResults(state, runDate) {
  const shouldFetch = state && state.length >= 4;

  return useSWR(
    shouldFetch ? ["/state_neighbor_results", state, runDate] : null,
    (endpoint, state, runDate) =>
      fetcher(endpoint, { origin: state, '"run.date"': runDate }),
    { refreshInterval: 0 }
  );
}

function useStateResults(state) {
  const shouldFetch = state && state.length >= 4;

  state = state === "D.C." ? "District of Columbia" : state;
  // Get
  // - The last 7 days
  // - Weekly model runs, going back until around two months ago
  // - Monthly runs, going back until a year ago
  const dateOffsets = [
    ..._.range(0, 8),
    ..._.range(8, 57, 7),
    ..._.range(57 + 7, 365, 31),
  ];

  const dates = _.map(
    dateOffsets,
    // Transform Date objects to YYYY-MM-DD for Postgres
    (n) => utcFormat("%Y-%m-%d")(timeDay.offset(new Date(), -1 * n))
  );

  return useSWR(
    shouldFetch ? ["/results_state_intervals", state] : null,
    // This very ugly line is a workaround for a bug in 'postgrest-client' - the
    // library fails to wrap the subject of the 'IN' clause in parentheses, which
    // is needed when talking to PostgREST.
    (endpoint, state) =>
      fetcherWithFilter(
        endpoint,
        { state },
        '"run.date"',
        `(${dates.join(",")})`
      ),
    { refreshInterval: 0 }
  );
}

function useCountyResults(fips) {
  const shouldFetch = fips && fips.length === 5;

  // Get
  // - The last 7 days
  // - Weekly model runs, going back until around two months ago
  // - Monthly runs, going back until a year ago
  const dateOffsets = [
    ..._.range(0, 8),
    ..._.range(8, 57, 7),
    ..._.range(57 + 7, 365, 31),
  ];

  const dates = _.map(
    dateOffsets,
    // Transform Date objects to YYYY-MM-DD for Postgres
    (n) => utcFormat("%Y-%m-%d")(timeDay.offset(new Date(), -1 * n))
  );

  return useSWR(
    shouldFetch ? ["/results", fips] : null,
    // This very ugly line is a workaround for a bug in 'postgrest-client' - the
    // library fails to wrap the subject of the 'IN' clause in parentheses, which
    // is needed when talking to PostgREST.
    (endpoint, fips) =>
      fetcherWithFilter(
        endpoint,
        { fips: fips },
        '"run.date"',
        `(${dates.join(",")})`
      ),
    { refreshInterval: 0 }
  );
}

function useInputData(fips) {
  const shouldFetch = fips && fips.length === 5;

  return useSWR(
    shouldFetch ? ["/frozen_latest_inputs", fips] : null,
    (endpoint, fips) => fetcher(endpoint, { fips, fips }),
    { refreshInterval: 0 }
  );
}

function useInputDataFromDate(fips, rundate) {
  const shouldFetch = fips && fips.length === 5;

  return useSWR(
    shouldFetch ? ["/inputs", fips, rundate] : null,
    (endpoint, fips, rundate) => fetcher(endpoint, { fips, rundate }),
    { refreshInterval: 0 }
  );
}

function useStateInputData(state) {
  const shouldFetch = state && state.length >= 4;

  state = state === "D.C." ? "District of Columbia" : state;

  return useSWR(
    shouldFetch ? ["/frozen_latest_state_inputs", state] : null,
    (endpoint, state) => fetcher(endpoint, { state, state }),
    { refreshInterval: 0 }
  );
}

function useStateInputDataFromDate(state, rundate) {
  const shouldFetch = state && state.length >= 4;

  state = state === "D.C." ? "District of Columbia" : state;

  return useSWR(
    shouldFetch ? ["/inputs_state", state, rundate] : null,
    (endpoint, state, rundate) => fetcher(endpoint, { state, rundate }),
    { refreshInterval: 0 }
  );
}

function useLogs(fips) {
  const shouldFetch = fips && fips.length === 5;

  return useSWR(
    shouldFetch ? ["/logs", fips] : null,
    (endpoint, fips) => fetcher(endpoint, { fips }),
    { refreshInterval: 0 }
  );
}

function useLogsDev(fips) {
  const shouldFetch = fips && fips.length === 5;

  return useSWR(
    shouldFetch ? ["/logs_dev", fips] : null,
    (endpoint, fips) => fetcher(endpoint, { fips }),
    { refreshInterval: 0 }
  );
}

function useWarnings(fips) {
  const shouldFetch = fips && fips.length === 5;

  return useSWR(
    shouldFetch ? ["/warnings", fips] : null,
    (endpoint, fips, date) => fetcher(endpoint, { fips }),
    { refreshInterval: 0 }
  );
}

function useWarningsDev(fips) {
  const shouldFetch = fips && fips.length === 5;

  return useSWR(
    shouldFetch ? ["/warnings_dev", fips] : null,
    (endpoint, fips, date) => fetcher(endpoint, { fips }),
    { refreshInterval: 0 }
  );
}

function useFailedRuns() {
  return useSWR(["/failed_runs"], fetcher, { refreshInterval: 0 });
}

function useFailedRunsDev() {
  return useSWR(["/failed_runs_dev"], fetcher, { refreshInterval: 0 });
}

export {
  useAllRunResults,
  useLatestCountyResults,
  useNeighboringStateResults,
  useNeighboringCountyResults,
  useStateResults,
  useCountyResults,
  useInputData,
  useInputDataFromDate,
  useStateInputData,
  useStateInputDataFromDate,
  useLogs,
  useLogsDev,
  useWarnings,
  useWarningsDev,
  useFailedRuns,
  useFailedRunsDev,
};
