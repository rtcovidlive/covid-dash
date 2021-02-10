import { select } from "d3-selection";
import _ from "lodash";
import { scaleLinear, scaleTime } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { timeMonth, timeWeek, timeDay } from "d3-time";
import Constants from "lib/Constants";
import { Util } from "lib/Util";
import Helpers from "./Helpers";

class CaseGrowthViz {
  constructor(el, onMouseover, onMouseout) {
    this._el = el;
    this._svg = select(el);
    this._onMouseover = onMouseover;
    this._onMouseout = onMouseout;
    this._mainChartStroke = "rgba(235, 83, 88, 1.0)";
    this._mainChartBars = "rgb(253, 230, 231)";
    this._mainChartDark = "rgb(249, 188, 189)";
    this._testChartBars = "#DDD";
    this._testChartDark = "#BBB";
  }

  setDimensions(width, height) {
    this._width = width;
    this._height = height;
    this._bottomChartOuterHeight = 110;
    this._mainChartOuterHeight = height - this._bottomChartOuterHeight;
    this._mainChartMargin = {
      left: 30,
      top: 10,
      right: 0,
      bottom: 0,
    };
    this._bottomChartMargin = {
      left: this._mainChartMargin.left,
      top: 25,
      right: this._mainChartMargin.right,
      bottom: 15,
    };
    this._mainChartInnerHeight =
      this._mainChartOuterHeight -
      this._mainChartMargin.bottom -
      this._mainChartMargin.top;
    this._bottomChartInnerHeight =
      this._bottomChartOuterHeight -
      this._bottomChartMargin.bottom -
      this._bottomChartMargin.top;
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
      return dataEntry.cases_new;
    }).cases_new;
    let maxCorrected = _.maxBy(series, (dataEntry) => {
      return dataEntry.corr_cases_new;
    }).corr_cases_new;
    let maxCasesY = Math.max(maxReported, maxCorrected) * 1.0; // give some buffer vertically

    let testCountSorted = _.sortBy(
      series,
      (dataEntry) => dataEntry.tests_new || 0
    );
    let maxTestsY = _.nth(testCountSorted, -3).tests_new;
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

    this.testsY = scaleLinear()
      .domain([0, maxTestsY])
      .range([
        this._height - this._bottomChartMargin.bottom,
        this._height -
          this._bottomChartOuterHeight +
          this._bottomChartMargin.top,
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
        .style("font", "12px " + Constants.fontStack)
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

  setUpTestCountAxes(chartContent) {
    let xAxisTranslation = Util.makeTranslation(
      0,
      this._height - this._bottomChartMargin.bottom
    );
    let yAxisTranslation = Util.makeTranslation(
      this._bottomChartMargin.left,
      0
    );
    this.setUpAxes(
      chartContent,
      this.testsY,
      this._width > 600 ? timeMonth : timeDay, // was timeMonth
      2,
      xAxisTranslation,
      yAxisTranslation,
      this._bottomChartMargin
    );
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
    this.setUpAxes(
      chartContent,
      this.mainChartY,
      0,
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
    this._testRects.each(function (t, tIndex, tElems) {
      if (targetDate === t.date) {
        select(tElems[tIndex]).attr("fill", self._testChartDark);
      }
    });
    this._testsOverLimit.each(function (t, tIndex, tElems) {
      if (targetDate === t.date) {
        select(tElems[tIndex]).style("fill", self._testChartDark);
      }
    });
  }

  unhighlightonMouseout(targetDate) {
    this._mainRects.attr("fill", this._mainChartBars);
    this._testRects.attr("fill", this._testChartBars);
    this._testsOverLimit.style("fill", this._testChartBars);
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
        return this.mainChartY.range()[0] - this.mainChartY(d.cases_new);
      })
      .attr("x", (d) => {
        return this.x(this.dataPointDate(d));
      })
      .attr("y", (d) => {
        return this.mainChartY(d.cases_new);
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

  renderTestCountBars(chartContent) {
    let self = this;
    let group = chartContent
      .selectAll("testCountBarsContainer")
      .data((d) => [d])
      .join("g");

    this._testRects = group
      .selectAll("testCountBars")
      .data((d) => d.series)
      .join("rect")
      .style("cursor", "pointer")
      .attr("width", this._barWidth)
      .attr("fill", this._testChartBars)
      .attr("height", (d) => {
        return this.testsY.range()[0] - this.testsY(d.tests_new);
      })
      .attr("x", (d) => {
        return this.x(this.dataPointDate(d));
      })
      .attr("y", (d) => {
        return this.testsY(d.tests_new);
      })
      .on("mouseover", function (d) {
        self.highlightOnMouseover(d.date);
        let bounds = this.getBBox();
        let x = bounds.x + bounds.width / 2;
        let y = bounds.y - 5;
        self.handleMouseover(x, y, d);
      })
      .on("mouseout", function (d) {
        self.handleMouseout();
      });

    this._testsOverLimit = group
      .selectAll("testCountOverLimit")
      .data((d) => {
        return _.filter(
          d.series,
          (entry) => entry.tests_new >= this.testsY.domain()[1]
        );
      })
      .join("polyline")
      .attr("points", (d) => {
        let points = [
          [this.x(this.dataPointDate(d)), this.testsY(d.tests_new)],
          [
            this.x(this.dataPointDate(d)) + this._barWidth / 2,
            this.testsY(d.corr_cases_new) - 5,
          ],
          [
            this.x(this.dataPointDate(d)) + this._barWidth,
            this.testsY(d.tests_new),
          ],
        ];
        return _.map(points, (point) => point.join(",")).join(" ");
      })
      .style("fill", this._testChartBars);
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
    this.setUpTestCountAxes(chartContent);
    this.renderTestCountBars(chartContent);
    Helpers.renderAnnotations(
      chartContent,
      (i) => {
        return this.dataPointDate(i);
      },
      this.x,
      this.mainChartY,
      "cases_new",
      1.0,
      11
    );
  }
}

export default CaseGrowthViz;
