import useSWR from "swr";
import fetcher from "./fetcher";

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

function useCountyResults(fips) {
  const shouldFetch = fips && fips.length === 5;

  return useSWR(
    shouldFetch ? ["/results", fips] : null,
    (endpoint, fips) => fetcher(endpoint, { fips: fips }),
    { refreshInterval: 0 }
  );
}

function useInputData(fips) {
  const shouldFetch = fips && fips.length === 5;

  return useSWR(
    shouldFetch ? ["/latest_inputs", fips] : null,
    (endpoint, fips, date) => fetcher(endpoint, { fips, fips }),
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
  useNeighboringCountyResults,
  useCountyResults,
  useInputData,
  useLogs,
  useLogsDev,
  useWarnings,
  useWarningsDev,
  useFailedRuns,
  useFailedRunsDev,
};
