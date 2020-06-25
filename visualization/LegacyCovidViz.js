/*eslint no-extend-native: ["error", { "exceptions": ["Date"] }]*/
import _ from "lodash";
import { select, mouse } from "d3-selection";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { line, area, curveBasis } from "d3-shape";
import { scaleLinear, scaleLog, scaleTime } from "d3-scale";
import { timeDay } from "d3-time";
import { axisBottom, axisRight, axisLeft } from "d3-axis";
import { bisector } from "d3-array";
import { Fields, F } from "lib/Protocol";
import Constants from "lib/Constants";
import { Util } from "lib/Util";

Date.prototype.onSameDate = function (otherDate) {
  return (
    this.getMonth() === otherDate.getMonth() &&
    this.getFullYear() === otherDate.getFullYear() &&
    this.getDate() === otherDate.getDate()
  );
};

class CovidViz {
  constructor(el, width, height, colorScales, margin, mouseMoveCallback) {
    this._el = el;
    this._margin = margin;
    this.setDimensions(width, height);
    this._minCases = 15;
    this._redColor = "rgba(235, 83, 88, 1.0)";
    this._greenColor = "rgba(53, 179, 46, 1.0)";
    this._colorScales = _.isArray(colorScales) ? colorScales : [colorScales];
    this._mouseMoveCallback = mouseMoveCallback;
    this._fontStack = Constants.fontStack;
    this.startup();
  }

  startup() {
    this.svg = select(this._el);
  }

  onExternalMouseOverX(mouseX) {
    this.handleChartMousemove(mouseX);
  }

  initSeriesConfigs() {
    const activeSeries = [];
    _.each(this._enabledModes, (m, i) => {
      var conf;
      switch (m) {
        case Constants.MetricOptions.PredictedCases: {
          conf = {
            submetric: Fields.cases_total,
            series: Fields.predictions,
            legend: "Cases",
            label: "Cases",
            dashedLine: true,
            showEndCap: !this._singleStateView,
            showAnnotations: this._showAnnotations,
            annotateLineEnd: true,
            confidenceBounds: true,
            isPrediction: true,
          };
          break;
        }
        case Constants.MetricOptions.PredictedDeaths: {
          conf = {
            submetric: Fields.deaths_total,
            series: Fields.predictions,
            legend: "Deaths",
            label: "Deaths",
            dashedLine: true,
            annotateLineEnd: true,
            showEndCap: !this._singleStateView,
            showAnnotations:
              this._showAnnotations && this._enabledModes.length <= 2,
            confidenceBounds: false,
            isPrediction: true,
          };
          break;
        }
        case Constants.MetricOptions.PredictedActiveCases: {
          conf = {
            submetric: Fields.cases_active,
            series: Fields.predictions,
            legend: "Active Cases",
            label: "Cases",
            dashedLine: true,
            showEndCap: !this._singleStateView,
            showAnnotations: this._showAnnotations,
            annotateLineEnd: true,
            confidenceBounds: false,
            isPrediction: true,
          };
          break;
        }
        case Constants.MetricOptions.ReportedCases: {
          conf = {
            submetric: Fields.cases_total,
            series: Fields.reported,
            legend: "Cases",
            label: "Cases",
            showEndCap:
              !this._singleStateView && this._enabledModes.length === 1,
            showAnnotations:
              this._showAnnotations && this._enabledModes.length === 1,
            isPrediction: false,
          };
          break;
        }
        case Constants.MetricOptions.ReportedNewCases: {
          conf = {
            submetric: Fields.cases_new,
            series: Fields.reported,
            legend: "New Cases",
            label: "Cases",
            dashedLine: true,
            showEndCap:
              !this._singleStateView && this._enabledModes.length === 1,
            showAnnotations: this._showAnnotations,
            isPrediction: false,
          };
          break;
        }
        case Constants.MetricOptions.ReportedDeaths: {
          conf = {
            submetric: Fields.deaths_total,
            series: Fields.reported,
            legend: "Deaths",
            label: "Deaths",
            showEndCap:
              !this._singleStateView && this._enabledModes.length === 1,
            showAnnotations:
              this._showAnnotations && this._enabledModes.length === 1,
            isPrediction: false,
          };
          break;
        }
        case Constants.MetricOptions.ReportedNewDeaths: {
          conf = {
            submetric: Fields.deaths_new,
            series: Fields.reported,
            legend: "New Deaths",
            label: "Deaths",
            showEndCap:
              !this._singleStateView && this._enabledModes.length === 1,
            showAnnotations:
              this._showAnnotations && this._enabledModes.length < 3,
            isPrediction: false,
          };
          break;
        }
        case Constants.MetricOptions.DerivedR0: {
          conf = {
            submetric: Fields.r0,
            series: Fields.r0,
            legend: "R",
            label: "R",
            colorCodeStroke: true,
            dashLastNDays: Constants.daysOffsetSinceEnd,
            showEndCap:
              !this._singleStateView && this._enabledModes.length === 1,
            showAnnotations:
              this._showAnnotations && this._enabledModes.length === 1,
            isPrediction: false,
            confidenceBounds: true,
            lineColorForEntry: (identifier, entry) => {
              return Util.colorCodeRt(
                identifier,
                F(entry, "count", "r0"),
                F(entry, "count", "low"),
                F(entry, "count", "high")
              );
            },
            drawYAxisLines: [1.0],
            m: (dataPoint, metricOverride) => {
              let raw =
                dataPoint[this._countMetric][metricOverride || Fields.r0];
              return Math.max(0, raw);
            },
          };
          break;
        }
        default: {
          throw new Error("Unknown Metric");
        }
      }
      conf.color = (identifier) => {
        if (conf.colorCodeStroke) {
          return `url(#${this._lineGradientID})`;
        }
        return this._colorScales[i % this._colorScales.length](identifier);
      };
      if (!conf.m) {
        conf.m = (dataPoint, metricOverride) =>
          this.m(dataPoint, conf.submetric, metricOverride);
      }
      conf.p5 = (dataPoint) => this.m(dataPoint, Fields.low_90);
      conf.p95 = (dataPoint) => this.m(dataPoint, Fields.high_90);
      conf.i = (dataPoint) => this.i(dataPoint);
      conf.formatDatapointForTooltip = (identifier, dataPoint) => {
        let numberFormat = format(",.2f");
        let prefix = this._singleStateView ? "" : identifier + ": ";
        let formattedNumber = numberFormat(dataPoint);
        let movingSuffix = this._showMovingAverage ? " (7d avg)" : "";
        if (this._singleStateView) {
          return `${prefix}${conf.legend}: ${formattedNumber}${movingSuffix}`;
        } else {
          return prefix + formattedNumber;
        }
      };
      conf.formatAnnotationTooltip = (identifier, description) => {
        let prefix = this._singleStateView ? "" : identifier + ": ";
        return prefix + description;
      };
      conf.line = line()
        .defined((d) => {
          const val = conf.m(d);
          const offset = conf.i(d);
          return !isNaN(val) && val >= 0 && val !== null && offset !== null;
        })
        .x((d) => {
          return this.x(conf.i(d));
        })
        .y((d) => {
          return this.y(conf.m(d));
        });

      conf.areaInner = area()
        .x((d, i) => {
          return this.x(conf.i(d));
        })
        .y0((d, i) => {
          let domain = this.y.domain();
          let val = conf.m(d, Fields.low_50);
          let useVal = Math.min(Math.max(domain[0], val), domain[1]);
          return this.y(useVal);
        })
        .y1((d, i) => {
          let domain = this.y.domain();
          let val = conf.m(d, Fields.high_50);
          let useVal = Math.min(Math.max(domain[0], val), domain[1]);
          return this.y(useVal);
        });
      conf.area = area()
        .x((d, i) => {
          return this.x(conf.i(d));
        })
        .y0((d, i) => {
          let domain = this.y.domain();
          let val = conf.p5(d);
          let useVal = Math.min(Math.max(domain[0], val), domain[1]);
          return this.y(useVal);
        })
        .y1((d, i) => {
          let domain = this.y.domain();
          let val = conf.p95(d);
          let useVal = Math.min(Math.max(domain[0], val), domain[1]);
          return this.y(useVal);
        });
      activeSeries.push(conf);
    });
    this._activeSeriesConfigs = activeSeries;
  }

  /* returns data point given current metric settings */
  m(dataPoint, submetric, metricOverride) {
    return dataPoint[metricOverride || this._countMetric][submetric];
  }

  /* overrides datapoint using current metric/submetric */
  setMetric(conf, dataPoint, value) {
    if (!dataPoint[this._countMetric]) {
      dataPoint[this._countMetric] = {};
    }
    dataPoint[this._countMetric][conf.submetric] = value;
  }

  /* returns value for x given current indexing settings */
  i(dataPoint, dontParseDate) {
    switch (this._indexing) {
      case Constants.IndexingOptions.ByDate: {
        return dontParseDate
          ? F(dataPoint, "date")
          : Util.dateFromISO(F(dataPoint, "date"), 1);
      }
      case Constants.IndexingOptions.IndexedToCaseThreshold: {
        return F(dataPoint, "since_case_threshold");
      }
      case Constants.IndexingOptions.IndexedToDeathThreshold: {
        return F(dataPoint, "since_death_threshold");
      }
      default: {
        throw new Error("Unknown indexing");
      }
    }
  }

  /* overrides index (x location) using current indexing settings */
  setIndex(dataPoint, value) {
    switch (this._indexing) {
      case Constants.IndexingOptions.ByDate: {
        dataPoint[Fields["date"]] = value;
        break;
      }
      case Constants.IndexingOptions.IndexedToCaseThreshold: {
        dataPoint[Fields["since_case_threshold"]] = value;
        break;
      }
      default: {
      }
    }
  }

  applyToAllPoints(rollupFn, perSeriesFn, perDataFn) {
    const rollup = rollupFn(
      _.map(this._activeSeriesConfigs, (conf) => {
        const thisSeries = perSeriesFn(
          this._data.map((d) => {
            return perSeriesFn(d[conf.series].map((e) => perDataFn(conf, e)));
          })
        );
        return thisSeries;
      })
    );
    return rollup;
  }

  applyToSeries(rollupFn, perSeriesFn) {
    const rollup = rollupFn(
      _.map(this._activeSeriesConfigs, (conf) => {
        const thisSeries = rollupFn(
          this._data.map((d) => {
            return perSeriesFn(conf, d);
          })
        );
        return thisSeries;
      })
    );
    return rollup;
  }

  setUpDomains() {
    const maxCases = this.applyToAllPoints(_.max, _.max, (conf, e) =>
      conf.confidenceBounds ? conf.m(e) : conf.m(e)
    );

    const minCasesForSeries = this.applyToAllPoints(_.min, _.min, (conf, e) =>
      conf.confidenceBounds ? conf.p5(e) : conf.m(e)
    );
    if (this._indexing !== Constants.IndexingOptions.ByDate) {
      const maxPoints = this.applyToSeries(_.max, (conf, d) => {
        const numValid = _.sumBy(d[conf.series], (s) => {
          return Number(conf.i(s) != null);
        });
        return numValid;
      });

      this.x = scaleLinear()
        .domain([0, maxPoints])
        .nice()
        .range([this._margin.left, this._chartWidth]);
    } else {
      const dateStart =
        this._minStartDate ||
        Util.dateFromISO(
          new Date(
            this.applyToSeries(_.min, (conf, d) => {
              return F(d[conf.series][0], "date");
            })
          ).toISOString(),
          1
        );
      const dateEnd = Util.dateFromISO(
        new Date(
          this.applyToSeries(_.max, (conf, d) =>
            F(d[conf.series][d[conf.series].length - 1], "date")
          )
        ).toISOString(),
        1
      );
      this.x = scaleTime()
        .domain([dateStart, dateEnd])
        .range([this._margin.left, this._width - this._margin.right]);
    }

    if (this._useLogScale) {
      this.y = scaleLog()
        .domain([Math.max(1, minCasesForSeries), maxCases])
        .nice()
        .range([this._height - this._margin.bottom, this._margin.top]);
    } else {
      this.y = scaleLinear()
        .domain(this._forceYDomain || [minCasesForSeries, maxCases * 1.05])
        .range([this._height - this._margin.bottom, this._margin.top])
        .nice();
    }
  }

  setUpAxes(chartContent) {
    const self = this;

    // plain white background for shadow
    var yAxisTicks = [];
    var yAxisTexts = [];

    function tickFormat(n) {
      yAxisTicks.push({ i: n, bold: self._highlightXAxisValue === n });
      var text;
      if (n < 1000) {
        text =
          n === self.y.domain()[0] || n === self.y.domain()[1]
            ? ""
            : format(".1f")(n);
      } else if (n < 1000000) {
        text = format(".1f")(n / 1000) + "k";
      } else {
        text = n / 1000000 + "m";
      }
      yAxisTexts.push(text);
      return text;
    }
    function logTickFormat(d) {
      var x = Math.log(d) / Math.log(10) + 1e-6;
      let isPowerOfTen = Math.abs(x - Math.floor(x)) < 0.2;
      return isPowerOfTen ? tickFormat(d) : "";
    }

    var xAxisTranslation,
      axisTimeFormat,
      ticks,
      firstIndexToShow,
      lastIndexToShow;
    if (this._xAxisPosition === "inside") {
      xAxisTranslation = Util.makeTranslation(
        0,
        this._height - this._margin.bottom - 20
      );
      ticks = timeDay;
      firstIndexToShow = 4;
      lastIndexToShow = -1 * (Constants.daysOffsetSinceEnd + 1);
      axisTimeFormat = timeFormat("%b %-d");
    } else {
      xAxisTranslation = Util.makeTranslation(
        0,
        this._height - this._margin.bottom + 5
      );
      ticks = timeDay;
      firstIndexToShow = 1;
      lastIndexToShow = -1;
      axisTimeFormat = timeFormat("%-m/%-d");
    }

    const xAxis = (g) =>
      g
        .attr("transform", xAxisTranslation)
        .style("font", Constants.labelTextSize + this._fontStack)
        .style("color", Constants.mediumGray)
        .call((g) => {
          let axis = axisBottom(this.x);

          if (this._indexing === Constants.IndexingOptions.ByDate) {
            axis.ticks(ticks);
          } else {
            axis.ticks(this._chartWidth / 100);
          }
          axis.tickFormat((dt, i, all) => {
            if (i === firstIndexToShow || i === all.length + lastIndexToShow) {
              return axisTimeFormat(dt);
            }
            return "";
          });
          return axis.tickSize(0)(g);
        })
        .call((g) => g.select(".domain").remove());

    let yAxis = (g) => {
      var axisFn, yAxisTranslation;
      switch (this._yAxisPosition) {
        case "right":
          axisFn = axisRight;
          yAxisTranslation = Util.makeTranslation(
            this._width - this._margin.right + 5,
            0
          );
          break;
        case "inside":
          axisFn = axisRight;
          yAxisTranslation = Util.makeTranslation(this._margin.left + 3, -8);
          break;
        case "left":
        default:
          axisFn = axisLeft;
          yAxisTranslation = Util.makeTranslation(this._margin.left - 5, 0);
          break;
      }
      return g
        .style("color", Constants.mediumGray)
        .style("font", Constants.labelTextSize + this._fontStack)
        .call((g) => {
          let axis = axisFn(this.y);
          axis.tickFormat(this._useLogScale ? logTickFormat : tickFormat);
          axis.ticks(this._height / 70);
          axis.tickSize(0);
          return axis(g);
        })
        .call((g) => g.select(".domain").remove())
        .call((g) => {
          let maxWidth = _.max(
            _.map(yAxisTexts, (text) =>
              this.BrowserText.getWidth(
                text,
                Constants.labelTextSize,
                this._fontStack
              )
            )
          );
          return g.attr("transform", yAxisTranslation);
        })
        .call((g) => {
          var linesToDraw = [];
          if (!this._singleStateView) {
            linesToDraw = _.filter(yAxisTicks, (e) => {
              let domain = this.y.domain();
              return e !== domain[0];
            });
          } else {
            linesToDraw = yAxisTicks;
          }
          let gridLines = chartContent
            .selectAll("gridLines")
            .data(linesToDraw)
            .join("g");
          gridLines
            .selectAll("gridLines.line")
            .data((d) => [d])
            .join("line")
            .attr("x1", this._margin.left)
            .attr("y1", (d) => this.y(d.i))
            .attr("x2", this._width - this._margin.right)
            .attr("y2", (d) => this.y(d.i))
            .attr("stroke", (d) =>
              d.bold ? Constants.boldGraphLineColor : Constants.graphLineColor
            );
        });
    };

    chartContent.append("g").call(xAxis);

    if (!this._singleStateView) {
      // add label to x-axis
      chartContent
        .append("g")
        .append("text")
        .text(this._indexing)
        .attr("text-anchor", "middle")
        .attr("fill", "#888")
        .attr(
          "transform",
          Util.makeTranslation(this._width / 2, this._height - 4)
        );
    }

    if (this._yAxisLabel && this._yAxisPosition !== "none") {
      let xOffset =
        this._yAxisPosition === "right" ? this._chartWidth + 50 : 10;
      let rotation = this._yAxisPosition === "right" ? 90 : -90;
      chartContent
        .append("g")
        .append("text")
        .text(this._yAxisLabel)
        .attr("text-anchor", "middle")
        .attr("fill", "#888")
        .attr(
          "transform",
          Util.makeTranslation(xOffset, this._height / 2, rotation)
        );
    }

    chartContent.append("g").call(yAxis);
    this._el.querySelectorAll(".tick > text:empty").forEach(function (e, i) {
      e.parentNode.parentNode.removeChild(e.parentNode);
    });
  }

  setUpTooltip() {
    this._tooltip = this.svg.append("g").attr("visibility", "hidden");
    this._tooltip
      .style("pointer-events", "none")
      .style("font", Constants.labelTextSize + this._fontStack);
    this._tooltipText = this._tooltip
      .selectAll("tooltip.textContainer")
      .data([null])
      .join("g");

    this._tooltipText
      .selectAll("tooltip.rect")
      .data([null])
      .join("rect")
      .attr("fill", "white")
      .attr("stroke", "black");

    this._tooltipLine = this._tooltip
      .selectAll("tooltip.line")
      .data([1])
      .join("line")
      .attr("x0", 0)
      .attr("y0", 0)
      .attr("x1", 0)
      .attr("y1", this._height - this._margin.bottom)
      .attr("stroke", "darkgray");
    this._tooltipDateFormat = timeFormat("%B %d, %Y");
  }

  updateTooltip(xPos, yPos, textArr, lineColor) {
    this._tooltip.attr("visibility", "visible");
    this._tooltip.selectAll("text").remove();
    this._tooltip.selectAll("rect").remove();
    this._tooltipLine.attr("transform", Util.makeTranslation(xPos, 0));
    this._tooltipLine.attr("stroke", lineColor || "darkgray");
    let rect = this._tooltipText
      .selectAll("tooltiprect")
      .data([null])
      .join("rect")
      .attr("x", -10)
      .attr("y", -20)
      .attr("fill", "white")
      .attr("opacity", 0.6);

    let textNodes = this._tooltipText
      .selectAll("text")
      .data([null])
      .join("text")
      .call((text) =>
        text
          .selectAll("tspan")
          .data(textArr)
          .join("tspan")
          .attr("x", 0)
          .text((d) => d.text)
          .attr("y", (d, i) => `${i * 1.2}em`)
          .style("font-weight", (d) => d.weight)
          .style("font", (d) =>
            d.weight === "bold"
              ? Constants.labelTextSize + this._fontStack + " bold"
              : Constants.labelTextSize + this._fontStack
          )
      );
    let { width: w, height: h } = textNodes.node().getBBox();
    let tooltipTopY = this._height - this._margin.bottom - h;
    rect.attr("width", w + 20).attr("height", h + 20);
    let textMargin = 10;
    if (w + xPos + textMargin > this._chartWidth) {
      xPos -= w + textMargin * 2;
    }
    this._tooltipText.attr(
      "transform",
      Util.makeTranslation(xPos + 10, tooltipTopY)
    );
  }

  hideTooltip() {
    this._tooltip.attr("visibility", "hidden");
  }

  BrowserText = (function () {
    var canvas = document.createElement("canvas"),
      context = canvas.getContext("2d");

    /**
     * Measures the rendered width of arbitrary text given the font size and font face
     * @param {string} text The text to measure
     * @param {number} fontSize The font size in pixels
     * @param {string} fontFace The font face ("Arial", "Helvetica", etc.)
     * @returns {number} The width of the text
     **/
    function getWidth(text, fontSize, fontFace) {
      context.font = fontSize + fontFace;
      return context.measureText(text).width;
    }

    return {
      getWidth: getWidth,
    };
  })();

  renderSeries(conf, index) {
    let seriesRoot = this.svg
      .selectAll("g.series" + index)
      .data(this._data, (d) => F(d, "identifier"))
      .join("g");

    let chartContent = seriesRoot
      .selectAll("g.chartContent")
      .data(
        (d) => [d],
        (d) => d.identifier
      )
      .join("g")
      .each(function (d) {
        this.parentNode.appendChild(this);
      });

    chartContent
      .append("rect")
      .attr("width", this._width - this._margin.left - this._margin.right)
      .attr("x", this._margin.left)
      .attr("y", this._margin.top)
      .attr("fill", "white")
      .attr("stroke", Constants.graphContainerStrokeColor)
      .attr("height", this._height - this._margin.bottom - this._margin.top);

    if (conf.confidenceBounds) {
      this.defineGradient(chartContent);
      this.renderConfidenceBounds(chartContent, conf);
    }
    if (index === 0) {
      this.setUpAxes(chartContent);
    }
    this.renderChartLines(chartContent, conf);

    if (conf.showEndCap) {
      this.renderEndCap(chartContent, conf);
    }

    if (conf.showAnnotations) {
      this.renderAnnotations(chartContent, conf);
    }
  }

  renderAnnotations(chartContent, conf) {
    let self = this;
    this._shelterGroups = chartContent
      .selectAll("interventions.groups")
      .data((d) => {
        return [
          _.filter(
            F(d, "interventions"),
            (d) => Util.dateFromISO(F(d, "date")) < this.x.domain()[1]
          ),
        ];
      })
      .join("g")
      .attr("opacity", 0);

    this._shelterGroups
      .selectAll("interventions.path.mousearea")
      .data((d) => {
        return _.map(d, (i) => {
          let index = conf.i(i, true);
          let searchElem = {};
          this.setIndex(searchElem, index);
          i[Fields["identifier"]] = F(d, "identifier");
          return i;
        });
      })
      .join("line")
      .attr("x1", (d) => {
        return this.x(conf.i(d));
      })
      .attr("x2", (d) => {
        return this.x(conf.i(d));
      })
      .attr("y1", (d) => {
        return self._height - self._margin.bottom;
      })
      .attr("y2", (d) => {
        return 0;
      })
      .attr("opacity", 1.0)
      .attr("stroke-width", "1px")
      .attr("stroke", Constants.mediumGray)
      .attr("stroke-dashoffset", "1")
      .attr("stroke-dasharray", "1 4");
    this._shelterGroups
      .selectAll("interventions.labels")
      .data((d) => d)
      .join("text")
      .text((d) => {
        let label = F(d, "type");
        if (label === Constants.InterventionTypes.ShelterInPlace) {
          label = "Shelter Order";
        } else if (label === Constants.InterventionTypes.ShelterEnded) {
          label = "Order Relaxed";
        }
        return label;
      })
      .attr("fill", Constants.lightGray)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .attr("transform", (d) =>
        Util.makeTranslation(this.x(conf.i(d)) - 3, 5, -90)
      );
  }

  defineGradient(chartContent) {
    const defs = chartContent.append("defs");
    let uuid = Util.uuidV4();
    this._backgroundGradientID =
      "svgGradient-vert-" + F(this._data[0], "identifier") + uuid;
    this._lineGradientID =
      "svgGradient-line" + F(this._data[0], "identifier") + uuid;
    let crossOver = (this.y(1.0) / this._height) * 100 + "%";
    var backgroundGradient = defs
      .append("linearGradient")
      .attr("id", this._backgroundGradientID)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");
    var lineGradient = defs
      .append("linearGradient")
      .attr("id", this._lineGradientID)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");
    let crossOverPoints = [
      { color: this._redColor, lightColor: "#FCF2F2", pct: "0%" },
      { color: this._redColor, lightColor: "#FCF2F2", pct: crossOver },
      { color: this._greenColor, lightColor: "#F2F9F0", pct: crossOver },
      { color: this._greenColor, lightColor: "#F2F9F0", pct: "100%" },
    ];
    _.each(crossOverPoints, (i) => {
      lineGradient
        .append("stop")
        .attr("offset", i.pct)
        .attr("stop-color", i.color)
        .attr("stop-opacity", 1);
      backgroundGradient
        .append("stop")
        .attr("offset", i.pct)
        .attr("stop-color", i.lightColor)
        .attr("stop-opacity", 1);
    });
  }

  renderChartLines(chartContent, conf) {
    let pathContainer = chartContent
      .selectAll("g.pathContainer")
      .data((d) => {
        return [d];
      })
      .join("g")
      .attr("stroke", (d) => {
        return conf.color(F(d, "identifier"));
      });

    let shouldAnimate = false;
    const path = pathContainer
      .selectAll("path.line")
      .data((d) => {
        let series = d[conf.series];
        if (conf.dashLastNDays) {
          return [series.slice(0, series.length - conf.dashLastNDays)];
        }
        return [series];
      })
      .join("path")
      .attr("fill", "none")
      .attr("opacity", () => (this._showMovingAverage ? 0.7 : 1.0))
      .attr("stroke-width", (d) =>
        conf.dashedLine ? 2 : this._singleStateView ? 1.5 : 1.5
      )
      .attr("stroke-linecap", "butt")
      .attr("d", (d) => {
        return conf.line(d);
      })
      .attr("stroke-dasharray", conf.dashedLine ? "1 3" : "0");

    if (conf.dashLastNDays) {
      pathContainer
        .selectAll("path.lineendmarker")
        .data((d) => {
          let series = d[conf.series];
          let len = series.length;
          return [series[len - conf.dashLastNDays - 1]];
        })
        .join("circle")
        .attr("fill", (d) => {
          let identifier = F(this._data[0], "identifier");
          return conf.lineColorForEntry(identifier, d);
        })
        .attr("r", 1)
        .attr("stroke-width", 3)
        .attr("cx", (d) => {
          return this.x(conf.i(d));
        })
        .attr("cy", (d) => this.y(conf.m(d)));
      pathContainer
        .selectAll("path.lineendtext")
        .data((d) => {
          let series = d[conf.series];
          let len = series.length;
          return [series[len - conf.dashLastNDays - 1]];
        })
        .join("text")
        .text((d) => {
          let numberFormat = format(",.2f");
          return numberFormat(conf.m(d));
        })
        .attr("stroke-width", 0)
        .attr("fill", (d) => {
          let identifier = F(this._data[0], "identifier");
          return conf.lineColorForEntry(identifier, d);
        })
        .attr("x", (d) => {
          return this.x(conf.i(d)) + 2;
        })
        .attr("font-size", 12)
        .attr("text-anchor", "end")
        .attr("font-weight", "bold")
        .attr("y", (d) => {
          let val = conf.m(d);
          let y = this.y(conf.m(d));
          return val > 1 ? y - 8 : y + 16;
        });
      pathContainer
        .selectAll("path.line-lastN")
        .data((d) => {
          let series = d[conf.series];
          let len = series.length;
          return [series.slice(len - conf.dashLastNDays - 1)];
        })
        .join("path")
        .attr("fill", "none")
        .attr("opacity", () => (this._showMovingAverage ? 0.7 : 1.0))
        .attr("stroke-width", (d) => 1.5)
        .attr("stroke-dashoffset", 0.0)
        .attr("stroke-dasharray", "1 4")
        .attr("stroke-linecap", "square")
        .attr("d", (d) => {
          return conf.line.curve(curveBasis)(d);
        });
    }

    if (this._showMovingAverage) {
      pathContainer
        .selectAll("path.lineMoving")
        .data((d) => {
          let moving = Util.movingAvg(
            _.map(d[conf.series], (i) => conf.m(i)),
            7
          );
          // TODO handle this moving average more elegantly
          _.each(d[conf.series], (entry, i) => (entry["_moving"] = moving[i]));
          return [d[conf.series]];
        })
        .join("path")
        .attr("fill", "none")
        .attr("stroke-width", (d) =>
          conf.dashedLine ? 2 : this._singleStateView ? 1.5 : 1.5
        )
        .attr("opacity", 1.0)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "butt")
        .attr("stroke-dasharray", "0")
        .attr("d", (g) => {
          // TODO move into its own fn
          return line()
            .defined((d) => {
              const val = d._moving;
              const offset = conf.i(d);
              return !isNaN(val) && val >= 0 && val !== null && offset !== null;
            })
            .x((d) => {
              return this.x(conf.i(d));
            })
            .y((d) => {
              return this.y(d._moving);
            })(g);
        });
    }
  }

  renderConfidenceBounds(chartContent, conf) {
    let areaContainer = chartContent
      .selectAll("g.areaContainer")
      .data((d) => {
        return [d];
      })
      .join("g")
      .style("pointer-events", "none")
      .attr("fill", (d) => {
        return `url(#${this._backgroundGradientID})`;
      });

    areaContainer
      .selectAll("area.path")
      .data((d) => {
        let filtered = [
          _.dropWhile(d[conf.series], (e) => {
            let val = conf.p5(e);
            return val === null;
          }),
        ];
        return filtered;
      })
      .join("path")
      .attr("opacity", () => (this._isUnderlayed ? 0.0 : 1.0))
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .style("pointer-events", "none")
      .attr("d", (s) => {
        return conf.area(s);
      });
    if (conf.show50ConfidenceBounds) {
      areaContainer
        .selectAll("area.path")
        .data((d) => {
          let filtered = [
            _.dropWhile(d[conf.series], (e) => {
              let val = conf.p5(e);
              return val === null;
            }),
          ];
          return filtered;
        })
        .join("path")
        .attr("opacity", () => (this._isUnderlayed ? 0.0 : 1.0))
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .style("pointer-events", "none")
        .attr("d", (s) => {
          return conf.areaInner(s);
        });
    }
  }

  renderEndCap(chartContent, conf) {
    const self = this;
    let markContainer = chartContent
      .selectAll("g.markContainer")
      .data((d) => {
        let seriesData = [
          [
            F(d, "identifier"),
            _.last(_.dropRightWhile(d[conf.series], (e) => conf.m(e) === null)),
          ],
        ];
        return _.filter(seriesData, (series) => series[1] !== undefined);
      })
      .join("g")
      .attr("fill", (d) => {
        return conf.color(F(d, "identifier"));
      });
    let labels = markContainer
      .selectAll("mark.label")
      .data((d) => [d])
      .join("g")
      .attr("transform", (d) => {
        if (!d) {
          return;
        }
        return (
          "translate(" +
          (this.x(conf.i(d[1])) - 6) +
          ", " +
          (this.y(conf.m(d[1])) + 3) +
          ")"
        );
      });
    let LABEL_SIZE = 25;
    labels
      .selectAll("mark.label.rect")
      .data((d) => [d])
      .join("rect")
      .attr("y", function (d) {
        return -15;
      })
      .attr("width", function (d) {
        return LABEL_SIZE;
      })
      .attr("height", function (d) {
        return LABEL_SIZE;
      })
      .attr("rx", 12)
      .attr("ry", 12)
      .attr("fill", "white")
      .attr("stroke", function (d) {
        return conf.color(d[0]);
      })
      .attr("stroke-width", "2");
    labels
      .selectAll("mark.label.text")
      .data((d) => [d])
      .join("text")
      .text(function (d) {
        return d[0];
      })
      .attr("x", function (d) {
        let text = d[0];
        let textWidth = self.BrowserText.getWidth(text, 11, "Helvetica");
        return LABEL_SIZE / 2.0 - textWidth / 2.0;
      })
      .attr("y", 1.5)
      .attr("font-size", "11px")
      .attr("text-anchor", "start")
      .attr("fill", function (d) {
        return conf.color(d[0]);
      })
      .attr("font-weight", "bold")
      .attr("font-family", "Helvetica");
  }

  setDimensions(width, height) {
    this._width = width;
    this._height = height;
    this._chartWidth = this._width - this._margin.left - this._margin.right * 2;
  }

  handleChartMousemove(mouseX) {
    if (mouseX === null) {
      this.hideTooltip();
    }
    let rawOffset = this.x.invert(mouseX);
    var offset;
    if (rawOffset < this.x.domain()[0]) {
      this.hideTooltip();
      return;
    }
    if (this._indexing === Constants.IndexingOptions.ByDate) {
      offset = new Date(new Date(rawOffset).setHours(0, 0, 0));
    } else {
      offset = Math.round(rawOffset);
    }
    var yPos = -Infinity;
    let metricsAtPoint = [];
    let annotationsAtPoint = [];
    var lineColor = null;
    _.map(this._activeSeriesConfigs, (conf) => {
      let bisect = bisector(function (datum) {
        return conf.i(datum);
      }).left;
      _.map(this._data, (d) => {
        let index = bisect(d[conf.series], offset);
        if (index < d[conf.series].length) {
          let entry = d[conf.series][index];
          let isSamePoint =
            this._indexing === Constants.IndexingOptions.ByDate
              ? conf.i(entry).onSameDate(offset)
              : conf.i(entry) === offset;
          let dataPoint = entry._moving || conf.m(entry);
          if (isSamePoint && dataPoint && dataPoint !== 0) {
            let isAfterLastNDays =
              index >= d[conf.series].length - conf.dashLastNDays;
            if (!isAfterLastNDays) {
              metricsAtPoint.push({
                weight: "normal",
                isPrediction: conf.isPrediction,
                text: conf.formatDatapointForTooltip(
                  F(d, "identifier"),
                  dataPoint,
                  conf.dashLastNDays
                    ? index >= d[conf.series].length - conf.dashLastNDays
                    : false
                ),
              });
            } else {
              metricsAtPoint.push({
                weight: "light",
                text: "Preliminary",
              });
            }
            yPos = Math.max(yPos, this.y(dataPoint));
            if (conf.lineColorForEntry) {
              lineColor = conf.lineColorForEntry(F(d, "identifier"), entry);
            }
          }
        }
        // handle annotations too
        if (conf.showAnnotations) {
          let annotations = F(d, Constants.AnnotationsSeries);
          let annotationsIndex = bisect(annotations, offset);
          if (annotationsIndex < annotations.length) {
            let annotation = annotations[annotationsIndex];
            let isSamePoint =
              this._indexing === Constants.IndexingOptions.ByDate
                ? conf.i(annotation).onSameDate(offset)
                : conf.i(annotation) === offset;
            if (isSamePoint) {
              let label = F(annotation, "type");
              if (label === Constants.InterventionTypes.ShelterInPlace) {
                label = "Shelter Order";
              } else if (label === Constants.InterventionTypes.ShelterEnded) {
                label = "Order Relaxed";
              }
              annotationsAtPoint.push({
                weight: "bold",
                text: conf.formatAnnotationTooltip(F(d, "identifier"), label),
              });
            }
          }
        }
      });
    });
    var tooltipHeader;
    if (typeof offset === typeof new Date()) {
      tooltipHeader = this._tooltipDateFormat(offset);
    } else if (this._singleStateView) {
      tooltipHeader = offset + " days";
    } else {
      let perCapPrefix = this._perCapita ? "/10,000 people" : "";
      tooltipHeader =
        this._activeSeriesConfigs[0].legend +
        perCapPrefix +
        " at " +
        offset +
        " days";
    }
    if (metricsAtPoint.length) {
      // if we have both reported & predicted, only show reported
      if (this._singleStateView && metricsAtPoint.length > 2) {
        _.remove(metricsAtPoint, (e) => e.isPrediction === true);
      }
      this.updateTooltip(
        mouseX,
        yPos,
        [
          { weight: "bold", text: tooltipHeader },
          ...metricsAtPoint,
          ...annotationsAtPoint,
        ],
        lineColor
      );
    } else {
      this.hideTooltip();
    }
  }

  preprocessData(data) {
    let self = this;
    function filterValidIndexes(indexField, enforceDateBounds) {
      return _.map(data, (state) => {
        return _.mapValues(state, (series) => {
          if (!_.isArray(series)) {
            // for non-series (eg the .identifier field) just return it
            return series;
          }
          return _.filter(series, (e) => {
            let index = e[indexField];
            var isValid = index !== null;
            if (
              isValid &&
              enforceDateBounds &&
              self._minStartDate &&
              self._maxEndDate
            ) {
              let indexDate = new Date(index);
              isValid =
                indexDate >= self._minStartDate &&
                indexDate <= self._maxEndDate;
            }
            return isValid;
          });
        });
      });
    }
    var validData;
    switch (this._indexing) {
      case Constants.IndexingOptions.ByDate: {
        validData = filterValidIndexes(Fields["date"], true);
        break;
      }
      case Constants.IndexingOptions.IndexedToCaseThreshold: {
        validData = filterValidIndexes(Fields["since_case_threshold"]);
        break;
      }
      case Constants.IndexingOptions.IndexedToDeathThreshold: {
        validData = filterValidIndexes(Fields["since_death_threshold"]);
        break;
      }
      default: {
        throw new Error("Unknown indexing " + this._indexing);
      }
    }
    if (this._perCapita) {
      _.each(validData, (state) => {
        _.each(state, (series, key) => {
          if (!_.isArray(series)) {
            return;
          }
          _.each(series, (entry) => {
            if (entry["percapita"]) {
              return;
            }
            entry["percapita"] = {};
            _.each(F(entry, "count"), (subvalue, subkey) => {
              let divided =
                subvalue === null
                  ? subvalue
                  : subvalue / (state.population / 10000);
              entry["percapita"][subkey] = divided;
            });
          });
        });
      });
    }
    return validData;
  }

  renderDateVerticals() {
    let verticalRoot = this.svg
      .selectAll("verticaldates")
      .data((d) => {
        let today = new Date();
        let markerDates = [];
        if (today < this.x.domain()[1]) {
          markerDates.push({ label: "Today", date: today });
        }
        return markerDates;
      })
      .join("g");

    verticalRoot
      .selectAll("verticaldates.lines")
      .data((d) => [d])
      .join("line")
      .attr("x1", (d) => {
        return this.x(d.date);
      })
      .attr("y1", 0)
      .attr("x2", (d) => {
        return this.x(d.date);
      })
      .attr("y2", this._height - this._margin.bottom)
      .attr("stroke", Constants.graphLineColor);

    verticalRoot
      .selectAll("verticaldates.text")
      .data((d) => [d])
      .join("text")
      .text((d) => d.label)
      .attr("text-anchor", "end")
      .attr("transform", (d) =>
        Util.makeTranslation(this.x(d.date) - 8, 0, -90)
      )
      .attr("fill", Constants.graphLineColor)
      .style("font", Constants.labelTextSize + this._fontStack);
  }

  renderSingleStateLegend() {
    _.map(this._activeSeriesConfigs, (conf, i) => {
      if (!conf.annotateLineEnd) {
        return;
      }
      let series = this._data[0][conf.series];
      let maxPoint = _.maxBy(series, (e) => {
        return conf.m(e);
      });
      let indexOfMax = _.sortedIndexBy(series, maxPoint, (e) => conf.i(e));
      let isNearEnd = indexOfMax >= series.length - 20;
      let identifier = F(this._data[0], "identifier");
      let xPos = this.x(conf.i(maxPoint));
      let yPos = this.y(conf.m(maxPoint));
      let endLineRoot = this.svg
        .selectAll("lineendannotations-" + i)
        .data([maxPoint])
        .join("g");

      endLineRoot
        .selectAll("annotation")
        .data((d) => [d])
        .join("text")
        .text((d) => conf.legend)
        .attr("x", (d) => {
          // TODO font spec
          let textWidth = this.BrowserText.getWidth(
            conf.legend,
            11,
            "Helvetica"
          );
          let offset = isNearEnd ? textWidth : textWidth / 2.0;
          return xPos - offset;
        })
        .attr("y", yPos - 8)
        .attr("fill", (d) => conf.color(identifier));
    });
  }

  setUpSVGDefs() {
    this._defs = this.svg.append("defs");
    var dropShadowFilter = this._defs.append("svg:filter");
  }

  setIsHovered(isHovered) {
    if (!this._shelterGroups) {
      return;
    }
    this._shelterGroups.attr("opacity", isHovered ? 1.0 : 0.0);
  }

  render(
    data,
    enabledModes,
    logScale,
    indexing,
    singleStateView,
    showAnnotations,
    yAxisPosition,
    xAxisPosition,
    perCapita,
    dateBounds,
    yAxisLabel,
    showMovingAverage,
    forceYDomain,
    highlightXAxisValue,
    isUnderlayed,
    isHovered
  ) {
    if (!data) {
      return;
    }

    let self = this;
    this._useLogScale = logScale;
    this._indexing = indexing;
    this._enabledModes = enabledModes;
    this._singleStateView = singleStateView;
    this._yAxisPosition = yAxisPosition;
    this._xAxisPosition = xAxisPosition;
    this._showAnnotations = showAnnotations;
    this._perCapita = perCapita;
    this._countMetric = perCapita ? "percapita" : Fields["count"];
    this._minStartDate = dateBounds && dateBounds[0];
    this._maxEndDate = dateBounds && dateBounds[1];
    this._yAxisLabel = yAxisLabel;
    this._showMovingAverage = showMovingAverage;
    this._forceYDomain = forceYDomain;
    this._highlightXAxisValue = highlightXAxisValue;
    this._isUnderlayed = isUnderlayed;
    this._data = this.preprocessData(data);
    this.initSeriesConfigs();
    this.svg.selectAll("g").remove();
    this.svg.selectAll("div").remove();
    this.svg.selectAll("rect").remove();

    this.setUpDomains(logScale);

    this.setUpSVGDefs();

    _.map(this._activeSeriesConfigs, (conf, i) => {
      this.renderSeries(conf, i);
    });

    if (this._singleStateView) {
      this.renderSingleStateLegend();
      this.renderDateVerticals();
    }

    this.setUpTooltip();
    this.svg
      .on("mousemove", function (e) {
        let mousePosition = mouse(this);
        if (self._mouseMoveCallback) {
          self._mouseMoveCallback(mousePosition[0]);
        } else {
          self.handleChartMousemove(mousePosition[0]);
        }
      })
      .on("mouseout", () => {
        if (self._mouseMoveCallback) {
          self._mouseMoveCallback(null);
        } else {
          this.hideTooltip();
        }
      });
    this.setIsHovered(isHovered);
    return this.svg.node();
  }
}

export default CovidViz;
