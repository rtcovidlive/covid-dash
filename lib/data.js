import useSWR from "swr";

const swrOptions = {
  // Refresh every hour
  refreshInterval: 1000 * 60 * 60 * 1,
};

const base = "http://localhost:3000";
const fetcher = (...args) => fetch(...args).then((res) => res.json());

function useLatestNeighborRuns(geo_name, options = { outcomes: ["*"] }) {
  const endpoint = "latest_neighbor_runs";
  const geo_info = "geo_info!neighbor_geo(pop)";

  let timeseries = "";
  if (options.outcomes !== null)
    timeseries = `,timeseries(${options.outcomes.join(",")}`;

  const url = `${base}/${endpoint}?origin_geo=eq.${geo_name}&select=*,${geo_info}${timeseries})`;

  return useSWR(geo_name ? url : null, fetcher, swrOptions);
}

function useHistoricalRuns(geo_name, options = { outcomes: ["*"] }) {
  const endpoint = "historical_runs";

  let timeseries = "";
  if (options.outcomes !== null)
    timeseries = `,timeseries(${options.outcomes.join(",")}`;

  const geo_info = "geo_info(pop)";

  const url = `${base}/${endpoint}?geo_name=eq.${geo_name}&select=*,${geo_info}${timeseries})`;

  return useSWR(geo_name ? url : null, fetcher, swrOptions);
}

function useLatestRun(geo_name, options = { outcomes: ["*"] }) {
  const endpoint = "latest_runs";
  const geo_info = "geo_info(pop)";

  let timeseries = "";
  if (options.outcomes !== null)
    timeseries = `,timeseries(${options.outcomes.join(",")}`;

  const url = `${base}/${endpoint}?geo_name=eq.${geo_name}&select=*,${geo_info}${timeseries})`;

  // This asks PostgREST to return the result as a single object, rather than
  // an as a one-element array.
  const fetchOptions = {
    headers: { Accept: "application/vnd.pgrst.object+json" },
  };

  return useSWR(
    geo_name ? url : null,
    (url) => fetcher(url, fetchOptions),
    swrOptions
  );
}

function useInputsForRun(run_id) {
  const endpoint = "inputs_for_run";

  const url = `${base}/${endpoint}?run_id=eq.${run_id}`;

  return useSWR(run_id ? url : null, fetcher, swrOptions);
}

function useLatestEnclosedRuns(parent_geo, options = { outcomes: ["*"] }) {
  const endpoint = "latest_enclosed_runs";

  let timeseries = "";
  if (options.outcomes !== null)
    timeseries = `,timeseries(${options.outcomes.join(",")}`;

  const geo_info = "geo_info!geo_for_run(pop)";

  const url = `${base}/${endpoint}?parent_geo=eq.${parent_geo}&select=*,${geo_info}${timeseries})`;

  return useSWR(parent_geo ? url : null, fetcher, swrOptions);
}

export {
  useLatestNeighborRuns,
  useHistoricalRuns,
  useLatestRun,
  useInputsForRun,
  useLatestEnclosedRuns,
};
