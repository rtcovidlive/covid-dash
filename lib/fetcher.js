import PostgREST from "postgrest-client";
import axios from "axios";
import { csvParse } from "d3-dsv";

const api_url = "https://api.covidestim.org";

export function fetcher(endpoint, params) {
  const Api = new PostgREST(api_url);

  const request = params ? Api.get(endpoint).match(params) : Api.get(endpoint);

  return axios
    .get(request.url, {
      params: request._query, // Steal the request parameters from PostgREST
      paramsSerializer: (ps) => ps.join("&"),
      headers: { Accept: "text/csv" }, // Get CSV, it's smaller
      transformResponse: (d) => csvParse(d), // Convert CSV => JSON
    })
    .then((res) => res.data);
}

export function fetcherWithFilter(endpoint, params, filterVar, filterValues) {
  const Api = new PostgREST(api_url);

  const request = Api.get(endpoint).match(params).in(filterVar, filterValues);

  console.log(request);

  return axios
    .get(request.url, {
      params: request._query, // Steal the request parameters from PostgREST
      // Ugly way of joining the parameters from PostgREST
      paramsSerializer: (ps) => ps.join("&"),
      headers: { Accept: "text/csv" }, // Get CSV, it's smaller
      transformResponse: (d) => csvParse(d), // Convert CSV => JSON
    })
    .then((res) => res.data);
}
