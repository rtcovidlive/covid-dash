import { select, event, mouse } from "d3-selection";
import { scaleSequential, scaleDiverging } from "d3-scale";
import { interpolateMagma, interpolateRdGy } from "d3-scale-chromatic";
import { geoPath, geoIdentity } from "d3-geo";
import { timeFormat } from "d3-time-format";
import { nest } from "d3-collection";
import { zoom, zoomIdentity, zoomTransform } from "d3-zoom";
import { mesh, feature } from "topojson";
import _ from "lodash";
import Constants from "lib/Constants";
import legend from "./ColorLegend";

class OverviewMap {
  constructor(el, onMouseover, onMouseout, addFips, addHoverFips) {
    this._el = el;
    this._svg = select(el);
    this._onMouseover = onMouseover;
    this._onMouseout = onMouseout;
    this._addFips = addFips;
    this._addHoverFips = addHoverFips;

    this.ColorInfections = scaleSequential([0, 200], interpolateMagma).unknown(
      "rgba(0, 0, 0, 0)"
    );

    this.ColorR0 = scaleDiverging([0.6, 1.0, 1.6], (t) =>
      interpolateRdGy(1 - t)
    ).unknown("rgba(0,0,0,0)");

    this.color = this.ColorInfections;
    this.accessor = "onsetsPC";
    this.date = null;
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

  titleLegend() {
    return this.accessor === "r0"
      ? "Effective reproduction number (Rt)"
      : "Estimated infections / 100k / day";
  }

  handleMetricChange(dateToDisplay, enabledModes) {
    let reRenderLegend = false;

    if (dateToDisplay === this.date) reRenderLegend = true;

    this.date = dateToDisplay;

    switch (enabledModes[0]) {
      case Constants.MetricOptions.DerivedR0NoUI: {
        this.color = this.ColorR0;
        this.accessor = "r0";
        break;
      }
      case Constants.MetricOptions.TrueInfectionsPCNoUI: {
        this.color = this.ColorInfections;
        this.accessor = "onsetsPC";
        break;
      }
      default: {
        this.color = this.ColorInfections;
        this.accessor = "onsetsPC";
        break;
      }
    }

    this._counties.join("path").attr("fill", (d) => {
      const record = this._data.get(this.date).get(d.id);
      return this.color(record ? record[this.accessor] : undefined);
    });

    if (reRenderLegend) {
      this.renderLegend(this.titleLegend());
    }
  }

  getStateName(fips, data) {
    const stateData = data.objects.states.geometries;

    let stateFips = String(Math.floor(fips / 1000));
    if (stateFips.length === 1) stateFips = "0" + stateFips;

    const state = _.find(stateData, (d) => stateFips === d.id);

    return state ? state.properties.name : "";
  }

  renderLegend(title) {
    if (this._legend) this._legend.remove();

    const legendX = Math.round((this._width * 15) / 975);
    let legendY = Math.round((this._height * 530) / 610);

    if (this._height - legendY <= 55) legendY = this._height - 55;

    const legendWidth = Math.max(220, Math.round((this._width * 180) / 975));

    this._legend = this._svg.append("g");

    this._legend
      .attr("transform", `translate(${legendX}, ${legendY})`)
      .append(() =>
        legend({
          color: this.color,
          title: title,
          width: legendWidth,
          marginRight: 15,
          marginLeft: 15,
        })
      )
      .insert("rect", ":first-child")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "rgb(255, 255, 255, 0.8)");
  }

  render(data, props) {
    let self = this;

    this._svg.selectAll("g").remove();
    this._svg.selectAll("path").remove();
    // this._svg.selectAll("div").remove();
    this._svg.selectAll("rect").remove();

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

    this.renderLegend(this.titleLegend());

    this._counties = g
      .append("g")
      .selectAll("path")
      .data(feature(us, us.objects.counties).features, (d) => d.id)
      .join("path")
      .attr("d", path)
      .on("click", clicked)
      .on("mouseover", function (d, i) {
        const bounds = this.getBBox();
        const preX = bounds.x + bounds.width / 2;
        const preY = bounds.y + bounds.height / 2;

        const [x, y] = zoomTransform(this).apply([preX, preY]);

        self.handleMouseover(x, y, d);
        self._addHoverFips({
          fips: d.id,
          name: d.properties.name,
          state: self.getStateName(d.id, self._boundaries),
        });
      })
      .on("mouseout", function (d) {
        self.handleMouseout();
      });

    this.handleMetricChange(
      props.dateToDisplay,
      Constants.MetricOptions.TrueInfectionsPCNoUI
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
      event.stopPropagation();

      self._addFips({
        fips: d.id,
        name: d.properties.name,
        state: self.getStateName(d.id, self._boundaries),
      });
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
