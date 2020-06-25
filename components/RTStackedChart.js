import React, { Component } from "react";
import { StackViz } from "visualization/StackViz";
import { Util } from "lib/Util";
import _ from "lodash";
import { format } from "d3-format";
import ChartTooltip from "./ChartTooltip";
import styled from "styled-components";

const TooltipRow = styled.p`
  margin: 0;
  font-weight: normal;
  min-width: 120px;
  color: ${(props) => props.color};
`;

export class RTStackedChart extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      tooltipX: null,
      toolTipY: null,
      tooltipShowing: false,
      tooltipContents: null,
    };
    this.containerRef = React.createRef();
  }

  calcSVGHeight() {
    if (this.props.verticalMode) {
      return 50 + this.calcNewStateContainerSize() * this.props.data.length;
    } else {
      return this.props.height;
    }
  }

  calcSVGWidth() {
    if (this.props.verticalMode) {
      return this.props.width;
    } else {
      let width = this.usableWidth();
      return width;
    }
  }

  usableWidth() {
    return this.props.width;
  }

  calcNewStateContainerSize() {
    if (this.props.verticalMode) {
      return 25;
    } else {
      let count = Math.max(2, this.props.data.length);
      let newBarWidth = Math.max(15, this.usableWidth() / count);
      return newBarWidth;
    }
  }

  handleStateMouseover(data) {
    var tooltipContents;
    if (data.special === "CI") {
      tooltipContents = (
        <span style={{ fontWeight: "normal" }}>
          We believe there's a {data.pct} chance that the true value lies in
          this range.
        </span>
      );
    } else {
      let numberFormat = format(",.2f");
      let color = Util.colorCodeRt(data.state, data.r0, data.low, data.high);
      tooltipContents = (
        <div style={{ textAlign: "left" }}>
          <TooltipRow>
            <span style={{ fontWeight: "bold", fontSize: "1.1em" }}>
              {this.props.subAreas[data.state]} R<sub>t</sub>
            </span>
          </TooltipRow>
          <TooltipRow>
            <span style={{ color: color, fontWeight: "bold" }}>
              {numberFormat(data.r0)}
            </span>{" "}
            Estimate
          </TooltipRow>
          <TooltipRow>
            <span style={{ fontWeight: "bold", color: "#999" }}>
              {numberFormat(data.low)}-{numberFormat(data.high)}{" "}
            </span>
            Range
          </TooltipRow>
        </div>
      );
    }
    this.setState({
      tooltipX: data.x,
      tooltipY: data.y,
      tooltipShowing: true,
      tooltipContents: tooltipContents,
    });
  }

  handleStateMouseout() {
    this.setState({
      tooltipShowing: false,
    });
  }

  renderChart() {
    this._viz.setDimensions(this.calcSVGWidth(), this.calcSVGHeight());
    this._viz.render(
      this.props.data,
      this.calcNewStateContainerSize(),
      this.props.verticalMode,
      this.props.detectedState
    );
  }
  componentDidMount() {
    this._viz = new StackViz(
      this.containerRef.current,
      this.props.onStateClicked,
      (state, val, coords) => {
        this.handleStateMouseover(state, val, coords);
      },
      () => {
        this.handleStateMouseout();
      }
    );
    if (this.props.data.length) {
      this._viz.setActiveStates(this.props.focusedStates, false);
      this.renderChart();
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevProps.offset !== this.props.offset) {
      this._viz.setDaysOffset(this.props.offset);
    } else if (!_.isEqual(prevProps.focusedStates, this.props.focusedStates)) {
      this._viz.setActiveStates(this.props.focusedStates, true);
    } else if (prevProps.width !== this.props.width) {
      if (this._widthChangeTimer) {
        clearTimeout(this._widthChangeTimer);
      }
      this._widthChangeTimer = setTimeout(() => {
        this.renderChart();
      }, 100);
    } else if (prevProps.data !== this.props.data) {
      this.renderChart();
    }
  }
  render() {
    return (
      <div style={{ position: "relative", overflow: "visible" }}>
        <ChartTooltip
          leftPosition={this.state.tooltipX}
          topPosition={this.state.tooltipY}
          showing={this.state.tooltipShowing}
          contents={this.state.tooltipContents}
        />
        <svg
          height={this.calcSVGHeight()}
          width={this.calcSVGWidth()}
          className="svg-container"
          ref={this.containerRef}
        ></svg>
      </div>
    );
  }
}
