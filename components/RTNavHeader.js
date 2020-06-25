import styled from "styled-components";
import Link from "next/link";
import Dropdown from "./Dropdown";
import { Navigation } from "../lib/Navigation";
import Constants from "../lib/Constants";
import { Util } from "../lib/Util";

const NavArrow = styled.span`
  color: rgba(0, 0, 0, 0.5);
  margin: 0px 6px;
`;

const NavHeaderLink = styled.span`
  font-size: 14px;
  > a {
    color: black;
    text-decoration: none;
  }
  > a:hover {
    color: black;
    text-decoration: underline;
  }
`;

const NavHeaderWrapperOuter = styled.div`
  width: 100%;
`;

const NavHeaderWrapperInner = styled.div`
  width: ${Constants.mainWidth};
  max-width: ${(props) => props.maxWidth}px;
  margin: 0 auto;
`;

const NavHeader = styled.div`
  margin: 0 auto;
  max-width: $inner-max-width;
  color: black;
  padding: 20px 50px 0px 50px;
  font-family: $font-stack;
  display: flex;
  align-items: center;
  @media screen and (max-width: 768px) {
    padding-left: 10px !important;
    padding-right: 10px !important;
  }
`;

export default function RTNavHeader(props) {
  let subareaMenuItems = _.map(props.config.subAreas, (val, key) => {
    return {
      key: key,
      label: val,
    };
  });
  let navigationQuery = Util.getNavigationQuery(document.location.search);
  return (
    <NavHeaderWrapperOuter>
      <NavHeaderWrapperInner maxWidth={props.maxWidth}>
        <NavHeader>
          <div>
            <NavHeaderLink>
              <Link
                href="/[countrycode]"
                as={{
                  pathname: `/`,
                  query: navigationQuery,
                }}
                prefetch={false}
              >
                <a>{props.config.title}</a>
              </Link>
            </NavHeaderLink>
            <NavHeaderLink>
              {" "}
              <NavArrow>&rarr;</NavArrow>{" "}
              <Dropdown
                options={subareaMenuItems}
                minWidth={220}
                onSelect={(e) => {
                  Navigation.navigateToSubArea(
                    props.config.code,
                    e.key,
                    document.location.search
                  );
                }}
              >
                <span>
                  {props.isOverall
                    ? "Overall"
                    : props.config.subAreas[props.subarea]}
                  <span
                    style={{ fontSize: 12, marginLeft: 4 }}
                    className="icon-caret-down"
                  />
                </span>
              </Dropdown>
            </NavHeaderLink>
          </div>
        </NavHeader>
      </NavHeaderWrapperInner>
    </NavHeaderWrapperOuter>
  );
}
