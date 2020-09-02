import { select } from "d3-selection";
import { scaleSequential } from "d3-scale";
import { interpolateMagma } from "d3-scale-chromatic";
import { geoPath } from "d3-geo";
import { mesh } from "topojson";

class OverviewMap {
  constructor(el, onMouseover, onMouseout) {
    this._el = el;
    this._svg = select(el);
    this._onMouseover = onMouseover;
    this._onMouseout = onMouseout;
  }

  setDimensions(width, height) {
    this._width = width;
    this._height = height;
  }

  setUpMap() {
    this.path = geoPath();
    this.color = scaleSequential([0, 200], interpolateMagma).unknown(
      "rgba(0, 0, 0, 0)"
    );
  }

  handleMouseout() {}

  handleMouseover(x, y, dataPoint) {}

  render(data) {
    console.log(data);

    this._data = data.mapData;
    this._boundaries = data.mapBoundaries;

    let us = this._boundaries;

    this._svg.selectAll("g").remove();
    this._svg.selectAll("path").remove();
    // this._svg.selectAll("div").remove();
    this._svg.selectAll("rect").remove();

    this._svg.attr("viewBox", [0, 0, this._width, this._height]);

    const g = this._svg.append("g");

    g.append("path")
      .datum(mesh(us, us.objects.states))
      .attr("fill", "none")
      .attr("stroke", "rgb(14, 112, 150)")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("d", geoPath());

    let chartContent = this._svg
      .selectAll("g.chartContent")
      .data([this._data], (d) => d.id)
      .join("g")
      .each(function (d) {
        this.parentNode.appendChild(this);
      });
    // this.setUpDomain();
    // this.setUpMainChartAxes(chartContent);
    // this.renderActualCountBars(chartContent);
    // this.renderCorrectedCounts(chartContent);
  }
}

export default OverviewMap;
