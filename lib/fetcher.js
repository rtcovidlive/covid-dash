import PostgREST from "postgrest-client";

export default async function fetcher(endpoint, params) {
  console.log(`GETting ${endpoint}`);

  const api_url = "https://api.covidestim.org";
  const Api = new PostgREST(api_url);

  console.log(params);
  if (params) return await Api.get(endpoint).match(params);

  return await Api.get(endpoint);
}
