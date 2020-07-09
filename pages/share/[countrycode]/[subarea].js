import _ from "lodash";
import PageConfig from "config/PageConfig";
import RTPage from "pages/[countrycode]/index";
import { getActiveCountries } from "config/ActiveConfig";

export async function getStaticPaths() {
  let active = getActiveCountries();
  let staticPaths = {
    fallback: false,
    paths: _.flatten(
      active.map((country) => {
        return _.map(_.keys(country.subAreas), (subArea) => {
          return {
            params: {
              countrycode: country.code,
              subarea: subArea,
            },
          };
        });
      })
    ),
  };
  return staticPaths;
}

export async function getStaticProps({ params }) {
  return {
    props: {
      countrycode: params.countrycode,
      subarea: params.subarea,
    },
  };
}

export default function SharePage(props) {
  return RTPage({ countryCode: props.countrycode, subarea: props.subarea });
}
