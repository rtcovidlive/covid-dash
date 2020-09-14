import React, { Component } from "react";
import styled from "styled-components";
import { timeFormat } from "d3-time-format";
import { format } from "d3-format";
import ChartTooltip from "./ChartTooltip";

export const LegendContainer = styled.div`
  display: inline-flex;
  flex-direction: column;
  width: auto;
  position: absolute;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 999999;
  line-height: 1.35;
  left: 2px;
`;

export const LegendRow = styled.div`
  flex-basis: 100%;
  display: flex;
  align-items: center;
`;

export const LegendLine = styled.span`
  background-color: ${(props) => props.backgroundColor};
  display: inline-block;
  width: 10px;
  height: 4px;
  margin-right: 8px;
  border-radius: 8px;
`;

export const LegendLabel = styled.span`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
`;

const CustomSVG = styled.svg`
  .tick line {
    display: none;
  }
  overflow: ${(props) => props.overflow};
`;

export const TooltipWrapper = styled.div`
  text-align: left;
  line-height: 1.35;
`;

export const TooltipDate = styled.div`
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  padding-bottom: 5px;
`;

export const TooltipLabel = styled.div`
  font-size: 14px;
  font-weight: normal;
  margin-top: 10px;
`;

export const TooltipStat = styled.div`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 0px;
  opacity: ${(props) => props.opacity || 1.0};
  color: ${(props) => props.color};
`;

export class RTSubareaChart extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this._timeFormat = timeFormat("%b %-d");
    this._numberFormat = format(",.0f");
    this.state = {
      viz: null,
      tooltipX: null,
      toolTipY: null,
      tooltipShowing: false,
      tooltipContents: null,
    };
    this.containerRef = React.createRef();

    this.overflow = "visible";
  }
  renderChart() {
    if (!this.state.viz) {
      return;
    }
    this.state.viz.setDimensions(this.props.width, this.props.height);
    this.state.viz.render(this.props.data, this.props);
  }
  componentDidMount() {
    let viz = new this._vizClass(
      this.containerRef.current,
      (data) => {
        this.handleMouseover(data);
      },
      () => {
        this.setState({ tooltipShowing: false });
      },
      (fips) => {
        this.props.addFips(fips);
      },
      (fips) => {
        this.props.addHoverFips(fips);
      }
    );
    this.setState({ viz: viz });
  }

  handleMouseover(data) {}

  handleDateChange(val) {
    this.state.viz.handleDateChange(val);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.width !== this.props.width) {
      if (this._widthChangeTimer) {
        clearTimeout(this._widthChangeTimer);
      }
      this._widthChangeTimer = setTimeout(() => {
        this.renderChart();
      }, 100);
    } else if (prevProps.data !== this.props.data) {
      this.renderChart();
    } else if (prevState.viz !== this.state.viz) {
      if (this.props.data) {
        this.renderChart();
      }
    }
  }

  renderLegend() {}

  render() {
    return (
      <div style={{ position: "relative" }}>
        {this.state.viz && this.renderLegend()}
        <div
          style={{
            position: "relative",
            marginLeft:
              this.props.marginLeft !== undefined ? this.props.marginLeft : -30,
          }}
        >
          <ChartTooltip
            leftPosition={this.state.tooltipX}
            topPosition={this.state.tooltipY}
            showing={this.state.tooltipShowing}
            contents={this.state.tooltipContents}
            minWidth={200}
          />
          <CustomSVG
            width={this.props.width}
            height={this.props.height}
            className="svg-container"
            ref={this.containerRef}
            overflow={this.overflow}
          ></CustomSVG>
        </div>
      </div>
    );
  }
}
