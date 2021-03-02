import PostgREST from "postgrest-client";

export default async function fetcher(endpoint, params) {
  console.log(`GETting ${endpoint}`);

  const api_url = "https://covidestim-test.herokuapp.com";
  const Api = new PostgREST(api_url);

  console.log(params);
  if (params) return await Api.get(endpoint).match(params);

  return await Api.get(endpoint);
}
