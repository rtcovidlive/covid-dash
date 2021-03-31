import PostgREST from "postgrest-client";

const api_url = "https://api.covidestim.org";

export async function fetcher(endpoint, params) {
  console.log(`GETting ${endpoint}`);

  const Api = new PostgREST(api_url);

  console.log(params);
  if (params) return await Api.get(endpoint).match(params);

  return await Api.get(endpoint);
}

export async function fetcherWithFilter(
  endpoint,
  params,
  filterVar,
  filterValues
) {
  console.log(`GETting ${endpoint}`);

  const Api = new PostgREST(api_url);

  console.log(params);

  if (params)
    return await Api.get(endpoint).match(params).in(filterVar, filterValues);

  return await Api.get(endpoint);
}
