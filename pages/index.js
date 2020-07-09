import RTPage from "./[countrycode]/index";
import { getDefaultCountry } from "config/ActiveConfig";

export async function getStaticProps({ params }) {
  return {
    props: {
      countrycode: getDefaultCountry(),
    },
  };
}

export default function Home(props) {
  return RTPage({ countrycode: props.countrycode });
}
