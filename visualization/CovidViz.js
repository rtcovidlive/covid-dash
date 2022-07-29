/*eslint no-extend-native: ["error", { "exceptions": ["Date"] }]*/
import _ from "lodash";
import { select, mouse } from "d3-selection";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { line, area, curveCatmullRom, curveBasis } from "d3-shape";
import { scaleLinear, scaleTime } from "d3-scale";
import { timeDay, timeWeek, timeMonth } from "d3-time";
import { axisBottom, axisRight, axisLeft } from "d3-axis";
import { bisector } from "d3-array";
import Constants from "lib/Constants";
import { Util } from "lib/Util";
import Helpers from "./Helpers";

Date.prototype.onSameDate = function (otherDate) {
  return (
    this.getMonth() === otherDate.getMonth() &&
    this.getFullYear() === otherDate.getFullYear() &&
    this.getDate() === otherDate.getDate()
  );
};

Date.prototype.onSameWeek = function (otherDate) {
  return timeWeek.floor(this).getTime() === timeWeek.floor(otherDate).getTime();
};

class CovidViz {
  constructor(el, width, height, colorScales, margin, mouseMoveCallback) {
    this._el = el;
    this._margin = margin;
    this.setDimensions(width, height);
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
        case Constants.MetricOptions.ReportedNewCases: {
          conf = {
            submetric: "input_cases",
            legend: "Positives",
            label: "Cases",
            dashedLine: true,
            showAnnotations: false,
            tooltipPrecision: ",.0d",
          };
          break;
        }
        case Constants.MetricOptions.TestCorrectedCases: {
          conf = {
            submetric: "corr_cases_new",
            legend: "Test-adjusted positives",
            label: "Cases",
            tooltipPrecision: ",.0d",
            dashedLine: false,
            showAnnotations: false,
          };
          break;
        }
        case Constants.MetricOptions.ReportedNewDeaths: {
          conf = {
            submetric: "input_deaths",
            legend: "New Deaths",
            label: "Deaths",
            showAnnotations:
              this._showAnnotations && this._enabledModes.length < 3,
          };
          break;
        }
        case Constants.MetricOptions.DerivedR0: {
          conf = {
            dashLastNWeeks: 2,
            displayPreliminary: false,
            submetric: "r_t",
            legend: "Rt",
            label: "Rt",
            colorCodeStroke: true,
            tooltipPrecision: ",.2f",
            showAnnotations:
              this._showAnnotations && this._enabledModes.length === 1,
            confidenceBounds: true,
            lineColorForEntry: (identifier, entry) => {
              return Util.colorCodeRt(
                identifier,
                entry.r_t,
                entry.r_t_p2_5,
                entry.r_t_p97_5
              );
            },
            drawYAxisLines: [1.0],
            m: (dataPoint, metricOverride) => {
              let raw = dataPoint[metricOverride || "r_t"];
              return Math.max(0, raw);
            },
            p5: (dataPoint) => this.m(dataPoint, "r_t_p2_5"),
            p95: (dataPoint) => this.m(dataPoint, "r_t_p97_5"),
          };
          break;
        }
        case Constants.MetricOptions.DerivedR0NoUI: {
          conf = {
            dashLastNWeeks: 2,
            displayPreliminary: false,
            submetric: "r_t",
            legend: "Rt",
            label: "Rt",
            colorCodeStroke: true,
            tooltipPrecision: ",.2f",
            showAnnotations:
              this._showAnnotations && this._enabledModes.length === 1,
            confidenceBounds: false,
            lineColorForEntry: (identifier, entry) => {
              return Util.colorCodeRt(identifier, entry.r0, entry.r0, entry.r0);
            },
            drawYAxisLines: [1.0],
            m: (dataPoint, metricOverride) => {
              let raw = dataPoint[metricOverride || "r_t"];
              return Math.max(0, raw);
            },
          };
          break;
        }
        case Constants.MetricOptions.TrueInfections: {
          conf = {
            dashLastNWeeks: 2,
            displayPreliminary: false,
            submetric: "infections",
            legend: "True infections",
            label: "True infections",
            colorCodeStroke: false,
            tooltipPrecision: ",.0f",
            showAnnotations:
              this._showAnnotations && this._enabledModes.length === 1,
            confidenceBounds: true,
            confidenceBoundsBackground: "rgba(185, 225, 245, 1)",
            lineColorForEntry: (identifier, entry) => {
              return "rgba(0, 145, 255, 1)";
            },
            m: (dataPoint, metricOverride) => {
              let raw = dataPoint[metricOverride || "infections"];
              return Math.max(0, raw);
            },
            p5: (dataPoint) => this.m(dataPoint, "infections_p2_5"),
            p95: (dataPoint) => this.m(dataPoint, "infections_p97_5"),
          };
          break;
        }
        case Constants.MetricOptions.TrueInfectionsNoUI: {
          conf = {
            dashLastNWeeks: 2,
            displayPreliminary: false,
            submetric: "infections",
            legend: "True infections",
            label: "True infections",
            colorCodeStroke: false,
            tooltipPrecision: ",.0f",
            showAnnotations:
              this._showAnnotations && this._enabledModes.length === 1,
            confidenceBounds: false,
            confidenceBoundsBackground: "rgba(185, 225, 245, 1)",
            lineColorForEntry: (identifier, entry) => {
              return "rgba(0, 145, 255, 1)";
            },
            m: (dataPoint, metricOverride) => {
              let raw = dataPoint[metricOverride || "infections"];
              return Math.max(0, raw);
            },
          };
          break;
        }
        case Constants.MetricOptions.TrueInfectionsPC: {
          conf = {
            dashLastNWeeks: 2,
            displayPreliminary: false,
            submetric: "infections_PC",
            legend: "Infections per 100k",
            label: "Infections per 100k",
            colorCodeStroke: false,
            tooltipPrecision: ",.0f",
            showAnnotations:
              this._showAnnotations && this._enabledModes.length === 1,
            confidenceBounds: true,
            confidenceBoundsBackground: "rgba(185, 225, 245, 1)",
            lineColorForEntry: (identifier, entry) => {
              return "rgba(0, 145, 255, 1)";
            },
            m: (dataPoint, metricOverride) => {
              let raw = dataPoint[metricOverride || "infections_PC"];
              return Math.max(0, raw);
            },
            p5: (dataPoint) => this.m(dataPoint, "infections_PC_p2_5"),
            p95: (dataPoint) => this.m(dataPoint, "infections_PC_p97_5"),
          };
          break;
        }
        case Constants.MetricOptions.TrueInfectionsPCNoUI: {
          conf = {
            dashLastNWeeks: 2,
            displayPreliminary: false,
            submetric: "infections_PC",
            legend: "True infections per 100k",
            label: "True infections per 100k",
            colorCodeStroke: false,
            tooltipPrecision: ",.0f",
            showAnnotations:
              this._showAnnotations && this._enabledModes.length === 1,
            confidenceBounds: false,
            lineColorForEntry: (identifier, entry) => {
              return "rgba(0, 145, 255, 1)";
            },
            m: (dataPoint, metricOverride) => {
              let raw = dataPoint[metricOverride || "infections_PC"];
              return Math.max(0, raw);
            },
          };
          break;
        }
        case Constants.MetricOptions.Seroprevalence: {
          conf = {
            dashLastNWeeks: 2,
            displayPreliminary: false,
            submetric: "infections_cumulative",
            legend: "cumulative infections per 100k",
            label: "cumulative infections per 100k",
            colorCodeStroke: false,
            tooltipPrecision: ",.3s",
            showAnnotations:
              this._showAnnotations && this._enabledModes.length === 1,
            confidenceBounds: true,
            confidenceBoundsBackground: "rgba(185, 225, 245, 1)",
            lineColorForEntry: (identifier, entry) => {
              return "rgba(0, 145, 255, 1)";
            },
            m: (dataPoint, metricOverride) => {
              let raw = dataPoint[metricOverride || "infections_cumulative"];
              return Math.max(0, raw);
            },
            p5: (dataPoint) => this.m(dataPoint, "infections_cumulative_p2_5"),
            p95: (dataPoint) =>
              this.m(dataPoint, "infections_cumulative_p97_5"),
          };
          break;
        }
        case Constants.MetricOptions.SeroprevalenceNoUI: {
          conf = {
            dashLastNWeeks: 2,
            displayPreliminary: false,
            submetric: "infections_cumulative",
            legend: "cumulative infections per 100k",
            label: "cumulative infections per 100k",
            colorCodeStroke: false,
            tooltipPrecision: ",.3s",
            showAnnotations:
              this._showAnnotations && this._enabledModes.length === 1,
            confidenceBounds: false,
            confidenceBoundsBackground: "rgba(185, 225, 245, 1)",
            lineColorForEntry: (identifier, entry) => {
              return "rgba(0, 145, 255, 1)";
            },
            m: (dataPoint, metricOverride) => {
              let raw = dataPoint[metricOverride || "infections_cumulative"];
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
      conf.i = (dataPoint) => this.i(dataPoint);
      conf.formatDatapointForTooltip = (identifier, dataPoint) => {
        let numberFormat = format(conf.tooltipPrecision);
        let formattedNumber = numberFormat(dataPoint);
        let movingSuffix = this._showMovingAverage ? " (7d avg)" : "";
        return `${formattedNumber}${movingSuffix} ${conf.legend}`;
      };
      conf.formatAnnotationTooltip = (identifier, description) => {
        return description;
      };
      conf.line = line()
        .defined((d) => {
          const val = conf.m(d);
          const offset = conf.i(d);
          return (
            !isNaN(val) &&
            val >= 0 &&
            val !== null &&
            offset !== null &&
            val <= this.y.domain()[1] * 1.03
          );
        })
        .x((d) => {
          return this.x(conf.i(d));
        })
        .y((d) => {
          return this.y(conf.m(d));
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
          return this.y(val);
        });
      activeSeries.push(conf);
    });
    this._activeSeriesConfigs = activeSeries;
  }

  /* returns data point given current metric settings */
  m(dataPoint, submetric) {
    return dataPoint[submetric];
  }

  /* overrides datapoint using current metric/submetric */
  setMetric(conf, dataPoint, value) {
    dataPoint[conf.submetric] = value;
  }

  /* returns value for x given current indexing settings */
  i(dataPoint, dontParseDate) {
    return dontParseDate ? dataPoint.date : Util.dateFromISO(dataPoint.date, 1);
  }

  /* overrides index (x location) using current indexing settings */
  setIndex(dataPoint, value) {
    dataPoint.date = value;
  }

  applyToAllPoints(rollupFn, perSeriesFn, perDataFn) {
    const rollup = rollupFn(
      _.map(this._activeSeriesConfigs, (conf) => {
        const thisSeries = perSeriesFn(
          this._data.map((d) => {
            return perSeriesFn(d.series.map((e) => perDataFn(conf, e)));
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
    const dateStart =
      this._minStartDate ||
      Util.dateFromISO(
        new Date(
          this.applyToSeries(_.min, (conf, d) => {
            return d.series[0].date;
          })
        ).toISOString(),
        1
      );
    const dateEnd = Util.dateFromISO(
      new Date(
        this.applyToSeries(
          _.max,
          (conf, d) => d.series[d.series.length - 1].date
        )
      ).toISOString(),
      1
    );
    this.x = scaleTime()
      .domain([dateStart, dateEnd])
      .range([this._margin.left, this._width - this._margin.right]);

    this.y = scaleLinear()
      .domain(this._forceYDomain || [minCasesForSeries, maxCases * 1.05])
      .range([this._height - this._margin.bottom, this._margin.top])
      .clamp(true)
      .nice();
  }

  setUpAxes(chartContent) {
    const self = this;

    // plain white background for shadow
    var yAxisTicks = [];
    var yAxisTexts = [];

    function tickFormat(n) {
      yAxisTicks.push({ i: n, bold: self._highlightXAxisValue === n });
      var text;
      if (n === 0) {
        text = "0";
      } else if (n < 10) {
        text = n === self.y.domain()[1] ? "" : format(".1f")(n);
      } else if (n < 1000) {
        text = n === self.y.domain()[1] ? "" : format(".0d")(n);
      } else if (n < 1000000) {
        if ((n / 1000) % 1 === 0) {
          text = format(".0d")(n / 1000) + "k";
        } else {
          text = format(".1f")(n / 1000) + "k";
        }
      } else {
        text = n / 1000000 + "m";
      }
      yAxisTexts.push(text);
      return text;
    }

    var xAxisTranslation,
      axisTimeFormat,
      ticks,
      firstIndexToShow,
      lastIndexToShow;
    if (this._xAxisPosition === "inside") {
      xAxisTranslation = Util.makeTranslation(
        10,
        this._height - this._margin.bottom - 20
      );
      ticks = timeDay;
      firstIndexToShow = 10;
      lastIndexToShow = -1 * (Constants.daysOffsetSinceEnd + 1);
      axisTimeFormat = timeFormat("%b %-d");
    } else {
      xAxisTranslation = Util.makeTranslation(
        0,
        this._height - this._margin.bottom + 5
      );
      if (this._width > 600) {
        ticks = timeMonth;
        firstIndexToShow = 1;
        lastIndexToShow = -1;
      } else {
        ticks = timeDay;
        firstIndexToShow = 5;
        lastIndexToShow = -1;
      }
      axisTimeFormat = timeFormat("%-m/%-d");
    }

    const xAxis = (g) =>
      g
        .attr("transform", xAxisTranslation)
        .style(
          "font",
          `${Helpers.getAxisFontSize(this._width)} ${this._fontStack}`
        )
        .style("color", Constants.mediumGray)
        .call((g) => {
          let axis = axisBottom(this.x);
          axis.ticks(ticks);
          axis.tickFormat((dt, i, all) => {
            if (
              this._width > 600 ||
              i === firstIndexToShow ||
              i === all.length + lastIndexToShow ||
              i === Math.floor(all.length / 2)
            ) {
              return axisTimeFormat(dt);
            }
            return "";
          });
          return axis.tickSize(0)(g);
        })
        .call((g) => g.selectAll("text").attr("text-anchor", "end"))
        .call((g) => g.select(".domain").remove());

    let yAxis = (g) => {
      var axisFn, yAxisTranslation;
      switch (this._yAxisPosition) {
        case "right":
          axisFn = axisRight;
          yAxisTranslation = Util.makeTranslation(
            this._width - this._margin.right + 2,
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
          let yAxisOffset = Helpers.getYAxisOffset(this._width);
          yAxisTranslation = Util.makeTranslation(
            this._margin.left - yAxisOffset,
            0
          );
          break;
      }
      return g
        .style("color", Constants.mediumGray)
        .style(
          "font",
          `${Helpers.getAxisFontSize(this._width)} ${this._fontStack}`
        )
        .call((g) => {
          let axis = axisFn(this.y);
          axis.tickFormat(tickFormat);
          axis.ticks(this._height / 70);
          axis.tickSize(0);
          return axis(g);
        })
        .call((g) => g.select(".domain").remove())
        .call((g) => {
          let maxWidth = _.max(
            _.map(yAxisTexts, (text) =>
              Helpers.BrowserText.getWidth(
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
    _(this._el.querySelectorAll(".tick > text:empty")).forEach(function (e, i) {
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
      .attr("opacity", 0.8);

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
    rect.attr("width", w + 10).attr("height", h + 10);
    let textMargin = 0;
    var translationOffset = 10;
    if (w + xPos + textMargin > this._chartWidth + 20) {
      xPos -= w + textMargin * 2;
      translationOffset = -10;
    }
    this._tooltipText.attr(
      "transform",
      Util.makeTranslation(xPos + translationOffset, tooltipTopY)
    );
  }

  hideTooltip() {
    this._tooltip.attr("visibility", "hidden");
  }

  renderSeries(conf, index) {
    let seriesRoot = this.svg
      .selectAll("g.series" + index)
      .data(this._data, (d) => d.identifier)
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

    if (this._drawOuterBorder) {
      chartContent
        .append("rect")
        .attr("width", this._width - this._margin.left - this._margin.right)
        .attr("x", this._margin.left)
        .attr("y", this._margin.top)
        .attr("fill", "white")
        .attr("stroke", Constants.graphContainerStrokeColor)
        .attr("height", this._height - this._margin.bottom - this._margin.top);
    }

    this.defineGradient(chartContent);

    if (conf.confidenceBounds) {
      this.renderConfidenceBounds(chartContent, conf);
    }
    if (index === 0) {
      this.setUpAxes(chartContent);
    }
    this.renderChartLines(chartContent, conf);

    if (conf.showAnnotations) {
      this.renderAnnotations(chartContent, conf);
    }
  }

  renderAnnotations(chartContent, conf) {
    if (this._useNewAnnotationStyle) {
      this._shelterGroups = Helpers.renderAnnotations(
        chartContent,
        conf.i,
        this.x,
        this.y,
        "r0",
        1.0,
        this._annotationsFontSize
      );
    } else {
      let self = this;
      this._shelterGroups = chartContent
        .selectAll("interventions.groups")
        .data((d) => {
          return [
            _.filter(
              d.annotations,
              (d) => Util.dateFromISO(d.date) < this.x.domain()[1]
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
            i.identifier = d.identifier;
            return i;
          });
        })
        .join("line")
        .attr("x1", (d) => {
          return Math.max(this.x(conf.i(d)), 4);
        })
        .attr("x2", (d) => {
          return Math.max(this.x(conf.i(d)), 4);
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
          return Constants.InterventionTypeLabels[d.type] || d.type;
        })
        .attr("fill", Constants.lightGray)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .attr("transform", (d) => {
          let x = this.x(conf.i(d)) - 3;
          if (x <= 16) {
            x = Math.max(x, 0) + 16;
          }
          return Util.makeTranslation(x, 5, -90);
        });
    }
  }

  defineGradient(chartContent) {
    [this._lineGradientID, this._backgroundGradientID] = Helpers.addGradientDef(
      chartContent,
      this.y,
      this._height
    );
  }

  renderChartLines(chartContent, conf) {
    let pathContainer = chartContent
      .selectAll("g.pathContainer")
      .data((d) => {
        return [d];
      })
      .join("g")
      .attr("stroke", (d) => {
        return conf.color(d.identifier);
      });

    const path = pathContainer
      .selectAll("path.line")
      .data((d) => {
        let series = d.series;
        if (conf.dashLastNWeeks) {
          return [series.slice(0, series.length - conf.dashLastNWeeks)];
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
        return conf.line.curve(curveCatmullRom)(d);
      })
      .attr("stroke-dasharray", conf.dashedLine ? "1 3" : "0");

    if (conf.dashLastNWeeks) {
      pathContainer
        .selectAll("path.line-lastN")
        .data((d) => {
          let series = d.series;
          let len = series.length;
          return [series.slice(len - conf.dashLastNWeeks - 1)];
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

    let lineEndLabelFont = this._annotationsFontSize + 4;
    pathContainer
      .selectAll("path.lineendmarker")
      .data((d) => {
        let series = d.series;
        let len = series.length;
        return [series[len - 1]];
      })
      .join("circle")
      .attr("fill", (d) => {
        let identifier = this._data[0].identifier;
        return conf.lineColorForEntry(identifier, d);
      })
      .attr("r", 1)
      .attr("stroke-width", 3)
      .attr("cx", (d) => {
        return this.x(conf.i(d)) - 1;
      })
      .attr("cy", (d) => this.y(conf.m(d)));

    pathContainer
      .selectAll("path.lineenduparrow")
      .data((d) => {
        let series = d.series;
        let len = series.length;
        return [series[len - 1]];
      })
      .join("text")
      .text((d) => {
        return conf.m(d) > this.y.domain()[1] ? "▲" : "";
      })
      .attr("stroke-width", 0)
      .attr("fill", (d) => {
        let identifier = this._data[0].identifier;
        return conf.lineColorForEntry(identifier, d);
      })
      .attr("x", (d) => {
        return this.x(conf.i(d)) - 1;
      })
      .attr("font-size", lineEndLabelFont)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("y", (d) => {
        let val = conf.m(d);
        let y = this.y(conf.m(d));
        return y - 3;
      });

    pathContainer
      .selectAll("path.lineendtext")
      .data((d) => {
        let series = d.series;
        let len = series.length;
        return [series[len - 1]];
      })
      .join("text")
      .text((d) => {
        let numberFormat = format(conf.tooltipPrecision || ",.2f");
        return numberFormat(conf.m(d));
      })
      .attr("stroke-width", 0.6)
      .attr("stroke-opacity", 0.75)
      .attr("stroke", "#fff")
      .attr("fill", (d) => {
        let identifier = this._data[0].identifier;
        return conf.lineColorForEntry(identifier, d);
      })
      .attr("x", (d) => {
        return this.x(conf.i(d)) - 6;
      })
      .attr("font-size", lineEndLabelFont)
      .attr("text-anchor", "end")
      .attr("font-weight", "bold")
      .attr("y", (d) => {
        let val = conf.m(d);
        let y = this.y(conf.m(d));
        return y + lineEndLabelFont / 2;
      });

    if (this._showMovingAverage) {
      pathContainer
        .selectAll("path.lineMoving")
        .data((d) => {
          let moving = Util.movingAvg(
            _.map(d.series, (i) => conf.m(i)),
            7
          );
          // TODO handle this moving average more elegantly
          _.each(d.series, (entry, i) => (entry["_moving"] = moving[i]));
          return [d.series];
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
        return (
          conf.confidenceBoundsBackground ||
          `url(#${this._backgroundGradientID})`
        );
      });

    areaContainer
      .selectAll("area.path")
      .data((d) => {
        let filtered = [
          _.dropWhile(d.series, (e) => {
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
    offset = new Date(new Date(rawOffset).setHours(0, 0, 0));
    var yPos = -Infinity;
    let metricsAtPoint = [];
    let annotationsAtPoint = [];
    var lineColor = null;
    _.map(this._activeSeriesConfigs, (conf, confIndex) => {
      let bisect = bisector(function (datum) {
        return conf.i(datum);
      }).left;
      var hasDoneAnnotations;
      _.map(this._data, (d) => {
        let index = bisect(d.series, offset);
        if (index < d.series.length) {
          let entry = d.series[index];
          let isSamePoint = conf.i(entry).onSameWeek(offset);
          let dataPoint =
            (this._showMovingAverage && entry._moving) || conf.m(entry);
          if (isSamePoint) {
            let isAfterLastNDays =
              index >= d.series.length - conf.dashLastNWeeks;
            if (!isAfterLastNDays || !conf.displayPreliminary) {
              metricsAtPoint.push({
                weight: "normal",
                text: conf.formatDatapointForTooltip(
                  d.identifier,
                  dataPoint,
                  conf.dashLastNWeeks
                    ? index >= d.series.length - conf.dashLastNWeeks
                    : false
                ),
              });
            } else {
              metricsAtPoint.push({
                weight: "light",
                text: "Preliminary",
              });
            }
            if (entry.annotations && confIndex === 0) {
              _(entry.annotations).forEach((e) => {
                let label = Constants.InterventionTypeLabels[e.type] || e.type;
                annotationsAtPoint.push({
                  weight: "bold",
                  text: conf.formatAnnotationTooltip(d.identifier, label),
                });
              });
            }
            yPos = Math.max(yPos, this.y(dataPoint));
            if (conf.lineColorForEntry) {
              lineColor = conf.lineColorForEntry(d.identifier, entry);
            }
          }
        }
      });
    });
    var tooltipHeader = this._tooltipDateFormat(offset);
    if (metricsAtPoint.length) {
      this.updateTooltip(
        mouseX,
        yPos,
        [
          ...annotationsAtPoint,
          { weight: "bold", text: tooltipHeader },
          ...metricsAtPoint,
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
    var validData = filterValidIndexes("date", true);
    return validData;
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
    showAnnotations,
    yAxisPosition,
    xAxisPosition,
    dateBounds,
    yAxisLabel,
    showMovingAverage,
    forceYDomain,
    highlightXAxisValue,
    isUnderlayed,
    isHovered,
    annotationsFontSize,
    drawOuterBorder,
    useNewAnnotationStyle
  ) {
    if (!data) {
      return;
    }

    let self = this;
    this._enabledModes = enabledModes;
    this._yAxisPosition = yAxisPosition;
    this._xAxisPosition = xAxisPosition;
    this._showAnnotations = showAnnotations;
    this._minStartDate = dateBounds && dateBounds[0];
    this._maxEndDate = dateBounds && dateBounds[1];
    this._yAxisLabel = yAxisLabel;
    this._showMovingAverage = showMovingAverage;
    this._forceYDomain = forceYDomain;
    this._highlightXAxisValue = highlightXAxisValue;
    this._isUnderlayed = isUnderlayed;
    this._drawOuterBorder = drawOuterBorder;
    this._data = this.preprocessData(data);
    this._annotationsFontSize = annotationsFontSize || 12;
    this._useNewAnnotationStyle = useNewAnnotationStyle;
    this.initSeriesConfigs();
    this.svg.selectAll("g").remove();
    this.svg.selectAll("div").remove();
    this.svg.selectAll("rect").remove();

    this.setUpDomains();

    this.setUpSVGDefs();

    _.map(this._activeSeriesConfigs, (conf, i) => {
      this.renderSeries(conf, i);
    });

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
