import { select, event, mouse } from "d3-selection";
import { scaleSequential } from "d3-scale";
import { interpolateMagma } from "d3-scale-chromatic";
import { geoPath } from "d3-geo";
import { timeFormat } from "d3-time-format";
import { nest } from "d3-collection";
import { zoom, zoomIdentity, zoomTransform } from "d3-zoom";
import { mesh, feature } from "topojson";
import _ from "lodash";

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
    // Nowhere is this function called, yet
  }

  handleMouseout() {}

  handleMouseover(x, y, dataPoint) {}

  render(data) {
    let self = this;

    this._svg.selectAll("g").remove();
    this._svg.selectAll("path").remove();
    // this._svg.selectAll("div").remove();
    this._svg.selectAll("rect").remove();

    const color = scaleSequential([0, 200], interpolateMagma).unknown(
      "rgba(0, 0, 0, 0)"
    );
    const path = geoPath();

    let dateLambda = (d) => {
      let obj = new Date(d * 24 * 3600 * 1000);
      return timeFormat("%Y-%m-%d")(obj);
    };

    const zoomer = zoom().scaleExtent([1, 8]).on("zoom", zoomed);

    this._data = data.mapData;

    this._data = _.zipWith(
      this._data.Rt,
      this._data.date,
      this._data.infections,
      this._data.fips,
      (r, d, i, f) => ({
        Rt: +r / 100,
        date: dateLambda(d),
        infections: i,
        fips: f,
      })
    );

    this._boundaries = data.mapBoundaries;

    this._dataIndexed = nest()
      .key((d) => d.date)
      .key((d) => d.fips)
      .rollup((d) => d[0].infections)
      .map(this._data);

    let us = this._boundaries;

    const states = new Map(
      feature(us, us.objects.states).features.map((d) => [d.id, d])
    );

    this._svg
      .attr("viewBox", [0, 0, this._width, this._height])
      .on("click", reset);

    const bg = this._svg
      .append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "rgb(7, 59, 79)");

    const g = this._svg.append("g");

    let counties = g
      .append("g")
      .selectAll("path")
      .data(feature(us, us.objects.counties).features, (d) => d.id)
      .join("path")
      .attr("d", path)
      .on("click", clicked);

    counties
      .join("path")
      .attr("fill", (d) =>
        color(this._dataIndexed.get("2020-08-15").get(d.id))
      );

    g.append("path")
      .datum(mesh(us, us.objects.states))
      .attr("fill", "none")
      .attr("stroke", "rgb(14, 112, 150)")
      .attr("stroke-linejoin", "round")
      .attr("d", path);

    this._svg.call(zoomer);

    function reset() {
      self._svg
        .transition()
        .duration(750)
        .call(
          zoomer.transform,
          zoomIdentity,
          zoomTransform(self._svg.node()).invert([
            self._width / 2,
            self._height / 2,
          ])
        );
    }

    function clicked(d) {
      const [[x0, y0], [x1, y1]] = path.bounds(states.get(d.id.slice(0, 2)));
      event.stopPropagation();

      self._svg
        .transition()
        .duration(750)
        .call(
          zoomer.transform,
          zoomIdentity
            .translate(self._width / 2, self._height / 2)
            .scale(
              Math.min(
                8,
                0.9 /
                  Math.max((x1 - x0) / self._width, (y1 - y0) / self._height)
              )
            )
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
          mouse(self._svg.node())
        );
    }

    function zoomed() {
      const { transform } = event;
      g.attr("transform", transform);
      g.attr("stroke-width", 1 / transform.k);
    }

    // let chartContent = this._svg
    //   .selectAll("g.chartContent")
    //   .data([this._data], (d) => d.id)
    //   .join("g")
    //   .each(function (d) {
    //     this.parentNode.appendChild(this);
    //   });
    //
    // this.setUpDomain();
    // this.setUpMainChartAxes(chartContent);
    // this.renderActualCountBars(chartContent);
    // this.renderCorrectedCounts(chartContent);
  }
}

export default OverviewMap;
