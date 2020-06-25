import _ from "lodash";
import { curveMonotoneX } from "d3-shape";
import { select } from "d3-selection";
import { scaleLinear, scaleTime } from "d3-scale";
import { line } from "d3-shape";
import React, { Component } from "react";
import Helpers from "visualization/Helpers";

const defaultLineStyle = {
  stroke: "steelblue",
  "stroke-width": 1.5,
  fill: "none",
  "stroke-linecap": "round",
};

export class SimpleSparkLine extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.containerRef = React.createRef();
  }

  renderChart() {
    let svg = select(this.containerRef.current);
    svg.selectAll("*").remove();

    let xs = _(this.props.xs);
    let ys = _(this.props.ys);
    let secondaryYs = _(this.props.secondaryYs);
    let range = _.range(xs.value().length);

    var ydomain = this.props.yDomain;
    if (!ydomain) {
      ydomain = [ys.min() * 0.95, ys.max() * 1.05];
      if (secondaryYs.value()) {
        ydomain = [
          Math.min(ydomain[0], secondaryYs.min()),
          Math.max(ydomain[1], secondaryYs.max()),
        ];
      }
    }

    let x = scaleTime()
      .domain([xs.min(), xs.max()])
      .range([2, this.props.width - 2]);

    let y = scaleLinear().domain(ydomain).range([this.props.height, 0]).nice();

    if (this.props.drawXAxis) {
      svg
        .append("line")
        .attr("x1", x(xs.min()) - 1)
        .attr("x2", x(xs.min()) - 1)
        .attr("y1", 0)
        .attr("y2", this.props.height)
        .attr("stroke", "#DDD")
        .attr("stroke-width", 1);
    }

    if (this.props.yLineAt) {
      svg
        .append("line")
        .attr("x1", 0)
        .attr("y1", y(this.props.yLineAt))
        .attr("x2", this.props.width)
        .attr("y2", y(this.props.yLineAt))
        .attr("stroke", "#DDD")
        .attr("stroke-width", 1);
    }

    let primaryLine = line()
      .curve(curveMonotoneX)
      .x((i) => x(xs.value()[i]))
      .y((i) => y(ys.value()[i]));

    let p = svg.append("path").datum(range).attr("d", primaryLine);
    let [lineGradient, backgroundGradient] = Helpers.addGradientDef(
      svg,
      y,
      this.props.height
    );

    _.forOwn(this.props.primaryLineStyle || defaultLineStyle, (v, k) =>
      p.attr(k, v)
    );

    if (this.props.primaryLineStyle.stroke === "gradient") {
      p.attr("stroke", `url(#${lineGradient})`);
    }

    if (this.props.drawEndDot) {
      let circleRadius = 3;
      svg
        .append("circle")
        .attr("cx", x(xs.last()) - circleRadius / 2)
        .attr("cy", y(ys.last()))
        .attr("r", circleRadius)
        .attr("fill", `url(#${lineGradient})`);
    }

    if (secondaryYs.value()) {
      let secondLine = line()
        .x((i) => x(xs.value()[i]))
        .y((i) => y(secondaryYs.value()[i]));

      let s = svg.append("path").datum(range).attr("d", secondLine);

      _.forOwn(this.props.secondaryLineStyle || defaultLineStyle, (v, k) =>
        s.attr(k, v)
      );
    }
  }
  componentDidMount() {
    if (this.props.data) {
      this.renderChart();
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevProps.width !== this.props.width) {
      if (this._widthChangeTimer) {
        clearTimeout(this._widthChangeTimer);
      }
      this._widthChangeTimer = setTimeout(() => {
        this.renderChart();
      }, 100);
    } else {
      this.renderChart();
    }
  }
  render() {
    return (
      <svg
        width={this.props.width}
        height={this.props.height}
        className="svg-container"
        style={{ overflow: "hidden" }}
        ref={this.containerRef}
      ></svg>
    );
  }
}
