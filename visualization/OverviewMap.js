import { select, event, mouse } from "d3-selection";
import { scaleSequential } from "d3-scale";
import { interpolateMagma } from "d3-scale-chromatic";
import { geoPath, geoIdentity } from "d3-geo";
import { timeFormat } from "d3-time-format";
import { nest } from "d3-collection";
import { zoom, zoomIdentity, zoomTransform } from "d3-zoom";
import { mesh, feature } from "topojson";
import _ from "lodash";
import legend from "./ColorLegend";

class OverviewMap {
  constructor(el, onMouseover, onMouseout, addFips, addHoverFips) {
    this._el = el;
    this._svg = select(el);
    this._onMouseover = onMouseover;
    this._onMouseout = onMouseout;
    this._addFips = addFips;
    this._addHoverFips = addHoverFips;
  }

  setDimensions(width, height) {
    this._width = width;
    this._height = height;
  }

  setUpMap() {
    // Nowhere is this function called, yet
  }

  handleMouseout() {
    this._onMouseout();
  }

  handleMouseover(x, y, dataPoint) {
    this._onMouseover({
      x: x,
      y: y,
      dataPoint: dataPoint,
    });
  }

  render(data) {
    let self = this;

    this._svg.selectAll("g").remove();
    this._svg.selectAll("path").remove();
    // this._svg.selectAll("div").remove();
    this._svg.selectAll("rect").remove();

    const color = scaleSequential([0, 200], interpolateMagma).unknown(
      "rgba(0, 0, 0, 0)"
    );

    let dateLambda = (d) => {
      let obj = new Date(d * 24 * 3600 * 1000);
      return timeFormat("%Y-%m-%d")(obj);
    };

    const zoomer = zoom().scaleExtent([1, 8]).on("zoom", zoomed);

    this._data = data.mapData;

    this._boundaries = data.mapBoundaries;

    let us = this._boundaries;

    const states = new Map(
      feature(us, us.objects.states).features.map((d) => [d.id, d])
    );

    this._svg
      .attr("viewBox", [0, 0, this._width, this._height])
      .on("click", reset);

    const transform = geoIdentity().fitSize(
      [this._width, this._height],
      feature(us, us.objects.nation)
    );
    const path = geoPath().projection(transform);

    const bg = this._svg
      .append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "rgb(7, 59, 79)");

    const g = this._svg.append("g");

    const legendX = Math.round((this._width * 630) / 975);
    const legendY = Math.round((this._height * 20) / 610);
    const legendWidth = Math.round((this._width * 260) / 975);

    this._svg
      .append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`)
      .append(() =>
        legend({
          color,
          title: "Infections / 100k / day",
          width: legendWidth,
          marginRight: 15,
          marginLeft: 15,
        })
      )
      .insert("rect", ":first-child")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "rgb(255, 255, 255, 0.8)");

    let counties = g
      .append("g")
      .selectAll("path")
      .data(feature(us, us.objects.counties).features, (d) => d.id)
      .join("path")
      .attr("d", path)
      .on("click", clicked)
      .on("mouseover", function (d, i) {
        const bounds = this.getBBox();
        const preX = bounds.x + bounds.width / 2;
        const preY = bounds.y + bounds.height / 2 - 10;

        const [x, y] = zoomTransform(this).apply([preX, preY]);

        self.handleMouseover(x, y, d);
        self._addHoverFips(d.id);
      })
      .on("mouseout", function (d) {
        self.handleMouseout();
      });

    counties.join("path").attr("fill", (d) => {
      const record = this._data.get("2020-08-01").get(d.id);
      return color(record ? record.onsets : undefined);
    });

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

      self._addFips(d.id);

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
