import { bisector } from "d3-array";
import { event, select, mouse } from "d3-selection";
import _ from "lodash";
import { scaleLinear, scaleTime } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { format } from "d3-format";
import { line } from "d3-shape";
import { timeFormat } from "d3-time-format";
import { timeMonth, timeWeek, timeDay } from "d3-time";
import Constants from "lib/Constants";
import { Util } from "lib/Util";
import Helpers from "./Helpers";

class TestAdjustedViz {
  constructor(el, onMouseover, onMouseout) {
    this._el = el;
    this._svg = select(el);
    this._onMouseover = onMouseover;
    this._onMouseout = onMouseout;
    //this._mainChartCountStroke = "rgba(235, 83, 88, 1.0)";
    this._mainChartCountStroke = "rgb(50,50,0,0.5)";
    this._mainChartInfectionStroke = "rgba(0, 145, 255, 1)";
    this._mainChartBars = "rgb(50,50,0,0.1)";
    this._mainChartDark = "rgba(50, 50, 0, 0.5)";
  }

  setDimensions(width, height) {
    this._width = width;
    this._height = height;
    this._mainChartOuterHeight = height;
    this._mainChartMargin = {
      left: 30,
      top: 0,
      right: 0,
      bottom: 30,
    };
    this._mainChartInnerHeight =
      this._mainChartOuterHeight -
      this._mainChartMargin.bottom -
      this._mainChartMargin.top;
  }

  dataPointDate(dataPoint) {
    if (dataPoint._parsedDate) {
      return dataPoint._parsedDate;
    }
    dataPoint._parsedDate = Util.dateFromISO(dataPoint.date);
    return dataPoint._parsedDate;
  }

  setUpDomain() {
    let series = this._data.series;
    let maxReported = _.maxBy(series, (dataEntry) => {
      return dataEntry.corr_cases_raw;
    }).corr_cases_raw;
    let maxCorrected = _.maxBy(series, (dataEntry) => {
      return dataEntry.corr_cases_new;
    }).corr_cases_new;
    let maxInfections = _.maxBy(series, (dataEntry) => {
      return dataEntry.onsets;
    }).onsets;
    let maxCasesY =
      Math.max(maxInfections, Math.max(maxReported, maxCorrected)) * 1.0; // give some buffer vertically

    let lastDay = new Date(
      this.dataPointDate(_.last(series)).getTime() + 1000 * 60 * 60 * 24
    );
    let dateRange = [this.dataPointDate(series[0]), lastDay];
    this.x = scaleTime()
      .domain(dateRange)
      .range([
        this._mainChartMargin.left,
        this._width - this._mainChartMargin.right,
      ]);

    this.mainChartY = scaleLinear()
      .domain([0, maxCasesY])
      .range([
        this._mainChartOuterHeight - this._mainChartMargin.bottom,
        this._mainChartMargin.top,
      ])
      .clamp(true)
      .nice();

    this._dayWidth =
      this.x(new Date(this.x.domain()[0].getTime() + 1000 * 60 * 60 * 24)) -
      this.x(this.x.domain()[0]);
    this._barWidth = this._dayWidth * 0.7;
  }

  setUpAxes(
    chartContent,
    y,
    numXAxisTicks,
    numYAxisTicks,
    xAxisTranslation,
    yAxisTranslation,
    margin
  ) {
    let self = this;
    let requestedTicks = [];
    let formatNum = (n) => {
      if (numYAxisTicks === 2 && n === y.domain()[1]) {
        return "";
      }
      requestedTicks.push(n);
      if (n < 1000) {
        return n;
      } else if (n < 10000) {
        if (n % 1000 === 0) {
          return format("d")(n / 1000) + "k";
        }
        return format(".1f")(n / 1000) + "k";
      } else {
        return format("d")(n / 1000) + "k";
      }
    };
    var ticks;
    let fontSize = Helpers.getAxisFontSize(this._width);
    let yAxis = (g) => {
      g.attr("transform", yAxisTranslation)
        .style("font", `${fontSize} ${Constants.fontStack}`)
        .style("color", "rgba(0,0,0,0.4)")
        .call((g) => {
          let axis = axisLeft(y);
          axis
            .ticks(numYAxisTicks)
            .tickFormat((n) => {
              return `${formatNum(n)}`;
            })
            .tickSize(0)(g);
        })
        .call((g) => g.select(".domain").remove());
    };
    chartContent.append("g").call(yAxis);
    let gridLines = chartContent
      .selectAll("gridlines")
      .data(requestedTicks)
      .join("g");
    gridLines
      .selectAll("gridlines.line")
      .data((d) => [d])
      .join("line")
      .attr("stroke", (d) =>
        d === 0 ? "rgba(0,0,0,0.5)" : "rgba(0, 0, 0, 0.075)"
      )
      .attr("stroke-width", "1px")
      .attr("x1", function (d) {
        return margin.left;
      })
      .attr("x2", function (d) {
        return self._width - margin.right;
      })
      .attr("y1", function (d) {
        return y(d) + 0.5;
      })
      .attr("y2", function (d) {
        return y(d) + 0.5;
      });

    let xAxis = (g) => {
      g.attr("transform", xAxisTranslation)
        .style("font", `${fontSize} ${Constants.fontStack}`)
        .style("color", Constants.mediumGray)
        .call((g) => {
          let axis = axisBottom(this.x)
            .ticks(numXAxisTicks)
            .tickFormat((dt, i, all) => {
              if (
                this._width > 600 ||
                i === 6 ||
                i === all.length - 1 ||
                i === Math.floor(all.length / 2) + 1
              ) {
                return timeFormat("%-m/%-d")(dt);
              }
            });
          return axis.tickSize(numXAxisTicks ? 3 : 0)(g);
        })
        .call((g) => g.select(".domain").remove());
    };
    chartContent.append("g").call(xAxis);
  }

  setUpMainChartAxes(chartContent) {
    let xAxisTranslation = Util.makeTranslation(
      0,
      this._mainChartOuterHeight - this._mainChartMargin.bottom
    );
    let yAxisTranslation = Util.makeTranslation(
      this._mainChartMargin.left - Helpers.getYAxisOffset(this._width),
      0
    );
    var timeScale;
    if (this._width > 600) {
      timeScale = timeWeek;
      timeScale = timeMonth;
    } else {
      timeScale = timeDay;
    }
    this.setUpAxes(
      chartContent,
      this.mainChartY,
      timeScale,
      3,
      xAxisTranslation,
      yAxisTranslation,
      this._mainChartMargin
    );
  }

  handleMouseout() {
    this._mouseTimeout = window.setTimeout(() => {
      this.unhighlightonMouseout();
      this._onMouseout();
    }, 300);
  }

  handleMouseover(x, y, dataPoint) {
    this.unhighlightonMouseout();
    if (this._mouseTimeout) {
      window.clearTimeout(this._mouseTimeout);
      this._mouseTimeout = null;
    }
    this.highlightOnMouseover(dataPoint.date);
    this._onMouseover({
      x: x,
      y: y,
      dataPoint: dataPoint,
    });
  }

  highlightOnMouseover(targetDate) {
    var self = this;
    this._mainRects.each(function (t, tIndex, tElems) {
      if (targetDate === t.date) {
        select(tElems[tIndex]).attr("fill", self._mainChartDark);
      }
    });
  }

  unhighlightonMouseout(targetDate) {
    this._mainRects.attr("fill", this._mainChartBars);
  }

  renderActualCountBars(chartContent) {
    let self = this;
    this._mainRects = chartContent
      .selectAll("mainContentBars")
      .data((d) => d.series)
      .join("rect")
      .style("cursor", "pointer")
      .attr("width", this._barWidth)
      .attr("fill", this._mainChartBars)
      .attr("height", (d) => {
        return this.mainChartY.range()[0] - this.mainChartY(d.corr_cases_raw);
      })
      .attr("x", (d) => {
        return this.x(this.dataPointDate(d));
      })
      .attr("y", (d) => {
        return this.mainChartY(d.corr_cases_raw);
      })
      .on("mouseover", function (d, i) {
        let bounds = this.getBBox();
        let x = bounds.x + bounds.width / 2;
        let y = bounds.y - 10;
        self.handleMouseover(x, y, d);
      })
      .on("mouseout", function (d) {
        self.handleMouseout();
      });
  }

  renderLine(chartContent, series, stroke, skip) {
    var self = this;
    skip = skip || 0;
    const bisect = bisector((el) => self.dataPointDate(el)).left;
    // broader stroke for mouseover
    chartContent
      .selectAll("mainContentLineMouseover." + series)
      .data((d) => [d.series.slice(skip)])
      .join("path")
      .style("cursor", "pointer")
      .attr("stroke", "rgba(0,0,0,0)")
      .attr("fill", "none")
      .attr("stroke-width", "15px")
      .attr("d", (d) => {
        let thisLine = line()
          .x((o) => this.x(this.dataPointDate(o)) + this._barWidth / 2)
          .y((o) => this.mainChartY(o[series]));
        return thisLine(d);
      })
      .on("mousemove", function (d, i, z) {
        event.stopPropagation();
        let coords = mouse(self._el);
        let inverted = self.x.invert(coords[0]);
        let series = select(this).datum();
        let closest = bisect(series, inverted);
        let entry = series[closest - 1];
        self.handleMouseover(coords[0], coords[1] - 15, entry);
      })
      .on("mouseover", function (d, i, z) {
        event.stopPropagation();
        let coords = mouse(self._el);
        let inverted = self.x.invert(coords[0]);
        let series = select(this).datum();
        let closest = bisect(series, inverted);
        let entry = series[closest - 1];
        self.handleMouseover(coords[0], coords[1] - 15, entry);
      })
      .on("mouseout", function () {
        event.stopPropagation();
        self.handleMouseout();
      });
    chartContent
      .selectAll("mainContentLine." + series)
      .data((d) => [d.series.slice(skip)])
      .join("path")
      .style("cursor", "pointer")
      .attr("stroke", stroke)
      .attr("fill", "none")
      .attr("stroke-width", "2px")
      .attr("d", (d) => {
        let thisLine = line()
          .x((o) => this.x(this.dataPointDate(o)) + this._barWidth / 2)
          .y((o) => this.mainChartY(o[series]));
        return thisLine(d);
      });
  }

  renderCorrectedCounts(chartContent) {
    this.renderLine(
      chartContent,
      "corr_cases_new",
      this._mainChartCountStroke,
      5
    );
    this.renderLine(chartContent, "onsets", this._mainChartInfectionStroke, 5);
  }

  render(data) {
    this._data = data;
    this._svg.selectAll("g").remove();
    this._svg.selectAll("div").remove();
    this._svg.selectAll("rect").remove();

    let chartContent = this._svg
      .selectAll("g.chartContent")
      .data([this._data], (d) => d.identifier)
      .join("g")
      .each(function (d) {
        this.parentNode.appendChild(this);
      });
    this.setUpDomain();
    this.setUpMainChartAxes(chartContent);
    this.renderActualCountBars(chartContent);
    this.renderCorrectedCounts(chartContent);
  }
}

export default TestAdjustedViz;
