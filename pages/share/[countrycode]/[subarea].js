import _ from "lodash";
import PageConfig from "config/PageConfig";
import RTPage from "pages/[countrycode]/index";

export async function getStaticPaths() {
  let active = _.keys(PageConfig);
  let staticPaths = {
    fallback: false,
    paths: _.flatten(
      active.map((country) => {
        return _.map(_.keys(PageConfig[country].subAreas), (subArea) => {
          return {
            params: {
              countrycode: country,
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
