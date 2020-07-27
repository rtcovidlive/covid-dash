import React, { Component } from "react";
import CovidViz from "visualization/CovidViz";

export class VisualizationChart extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.containerRef = React.createRef();
  }
  renderChart() {
    this._viz.setDimensions(this.props.width, this.props.height);
    this._viz.render(
      this.props.data,
      this.props.enabledModes,
      this.props.showAnnotations,
      this.props.yAxisPosition,
      this.props.xAxisPosition,
      this.props.dateBounds,
      this.props.yAxisLabel,
      this.props.showMovingAverage,
      this.props.forceYDomain,
      this.props.highlightXAxisValue,
      this.props.isUnderlayed,
      this.props.isHovered,
      this.props.annotationsFontSize,
      this.props.drawOuterBorder,
      this.props.useNewAnnotationStyle
    );
  }
  componentDidMount() {
    this._viz = new CovidViz(
      this.containerRef.current,
      this.props.width,
      this.props.height,
      this.props.colorScales,
      this.props.margin,
      this.props.mouseMoveCallback
    );
    if (this.props.data) {
      this.renderChart();
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevProps.mouseOverX !== this.props.mouseOverX) {
      this._viz.onExternalMouseOverX(this.props.mouseOverX);
    } else if (prevProps.isHovered !== this.props.isHovered) {
      this._viz.setIsHovered(this.props.isHovered);
    } else if (prevProps.width !== this.props.width) {
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
        style={{ overflow: "visible" }}
        ref={this.containerRef}
      ></svg>
    );
  }
}
