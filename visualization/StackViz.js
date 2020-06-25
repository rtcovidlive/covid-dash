import _ from "lodash";
import { color } from "d3-color";
import { select } from "d3-selection";
import { axisLeft, axisTop, axisBottom } from "d3-axis";
import { transition, active } from "d3-transition";
import { easeSinOut } from "d3-ease";
import { scaleLinear } from "d3-scale";
import { range } from "d3-array";
import { format } from "d3-format";
import { Util } from "lib/Util";
import Constants from "lib/Constants";

export class StackViz {
  constructor(el, stateClickedCallback, onStateMouseover, onStateMouseOut) {
    this._el = el;
    this._redColor = "rgba(235, 83, 88, 1.0)";
    this._greenColor = "rgba(53, 179, 46, 1.0)";
    this._yellowColor = "rgba(247, 181, 0.01, 1.0)";
    this._disabledColor = "rgba(0, 0, 0, 1.0)";
    this._50CIOpacity = 0.2;
    this._90CIOpacity = 0.1;
    this._bubbleWidth = 24;
    this._bubbleHeight = 18;
    this._animationLength = 600;
    this._entranceRValue = 2.0;
    this._margin = this.Horizontal.margin; // sane default
    this._fontStack = Constants.fontStack;
    this._onStateClicked = stateClickedCallback || function () {};
    this._onStateMouseover = onStateMouseover || function () {};
    this._onStateMouseOut = onStateMouseOut || function () {};
    this._currentOffset = -1 - Constants.daysOffsetSinceEnd;
    this._offsetQueue = [];
    this.startup();
  }

  startup() {
    this.svg = select(this._el);
  }
  Vertical = {
    barDimension: "width",
    containerDimension: "height",
    barAxis: "x",
    containerAxis: "y",
    margin: {
      left: 10,
      bottom: 30,
      top: 40,
      right: 10,
    },
    containerPositionFn: (i) => this.y(i),
    barPositionFn: (i) => this.x(i),
    axisTranslation: () => Util.makeTranslation(0, this._margin.top - 8),
    axisFn: (xAxis, yAxis) => axisTop(xAxis),
    secondaryAxisFn: (xAxis, yAxis) => axisBottom(xAxis),
    secondaryAxisTranslation: () =>
      Util.makeTranslation(0, this._height - this._margin.bottom + 8),
    numAxisTicks: () => this._width / 60,
    axisLabelTranslation: () => Util.makeTranslation(this._width / 2, 10, 0),
    innerBarRelativeToContainer: (height) => {
      return -height / 2 - this._eachStateWidth / 2;
    },
    innerBarRelativeToAxis: (low, high) => {
      return this.x(low);
    },
    translationForLabelGroup: (rtValue) => {
      return Util.makeTranslation(this.x(rtValue) - this._bubbleWidth / 2, -3);
    },
    translateOuterBar: (d) => {
      return Util.makeTranslation(0, this.y(d["sort"]));
    },
    labelRectPosition: (height) => -1 * height,
    outerLabelRectOffsetY: 2.5,
    outerLabelRectOffsetX: -2.5,
    labelYOffset: -5.5,
    makeGradientPoints: () => {
      let crossOver =
        (this._activeConfig.barPositionFn(1.0) / this._width) * 100 + "%";
      return [
        { color: this._greenColor, pct: "0%" },
        { color: this._greenColor, pct: crossOver },
        { color: this._redColor, pct: crossOver },
        { color: this._redColor, pct: "100%" },
      ];
    },
  };

  Horizontal = {
    margin: {
      left: 50,
      bottom: 5,
      top: 15,
      right: 8,
    },
    barDimension: "height",
    containerDimension: "width",
    barAxis: "y",
    containerAxis: "x",
    containerPositionFn: (i) => this.x(i),
    barPositionFn: (i) => this.y(i),
    axisTranslation: () => Util.makeTranslation(this._margin.left - 10, 0),
    axisFn: (xAxis, yAxis) => axisLeft(yAxis),
    axisLabelTranslation: () => Util.makeTranslation(10, this._height / 2, -90),
    numAxisTicks: () => this._height / 60,
    innerBarRelativeToAxis: (low, high) => {
      return this.y(high);
    },
    innerBarRelativeToContainer: (width) => {
      return -width / 2 + this._eachStateWidth / 2;
    },
    translationForLabelGroup: (rtValue) => {
      return Util.makeTranslation(0, this.y(rtValue));
    },
    translateOuterBar: (d) => {
      return Util.makeTranslation(this.x(d["sort"]), 0);
    },
    labelRectPosition: (height) => (-1 * height) / 2,
    labelYOffset: 3.5,
    outerLabelRectOffsetY: 0,
    outerLabelRectOffsetX: -2.5,
    makeGradientPoints: () => {
      let crossOver =
        (this._activeConfig.barPositionFn(1.0) / this._height) * 100 + "%";
      return [
        { color: this._redColor, pct: "0%" },
        { color: this._redColor, pct: crossOver },
        { color: this._greenColor, pct: crossOver },
        { color: this._greenColor, pct: "100%" },
      ];
    },
  };

  setUpSVGDefs() {
    var dropShadowFilter = this._defs
      .append("svg:filter")
      .attr("id", "dropShadow");

    dropShadowFilter
      .append("svg:feDropShadow")
      .attr("dx", 0)
      .attr("dy", 0)
      .attr("flood-color", "#E6E6E6")
      .attr("stdDeviation", 2);

    var labelDropShadowFilter = this._defs
      .append("svg:filter")
      .attr("id", "dropShadowLabels");

    labelDropShadowFilter
      .append("svg:feDropShadow")
      .attr("dx", 0)
      .attr("dy", 1)
      .attr("flood-color", "rgba(0,0,0,0.12)")
      .attr("stdDeviation", 1);

    let identifiers = _.map(this._data, (state) => state["identifier"]);
    _.each(identifiers, function (identifier) {
      // makeGradient(identifier, 1.0);
    });

    let id = "svgGradient-background";
    var gradient = this._defs
      .append("linearGradient")
      .attr("id", id)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr(this._activeConfig.containerAxis + "1", "0%")
      .attr(this._activeConfig.containerAxis + "2", "0%")
      .attr(this._activeConfig.barAxis + "1", "0%")
      .attr(this._activeConfig.barAxis + "2", "100%");
    for (let i = 0; i < 4; i++) {
      gradient.append("stop");
    }
    this.updateBackgroundGradient();
  }

  setDimensions(width, height) {
    this._width = width;
    this._height = height;
    this._contentWidth = this._width - this._margin.left;
    this._contentHeight = this._height - this._margin.top - this._margin.bottom;
  }

  setUpBackground() {
    // plain white background for shadow
    this.svg
      .append("rect")
      .attr("width", this._width - this._margin.left - this._margin.right)
      .attr("x", this._margin.left)
      .attr("y", this._margin.top)
      .attr("fill", "white")
      .attr("height", this._height - this._margin.bottom - this._margin.top);

    this.svg
      .append("rect")
      .attr("width", this._width - this._margin.left - this._margin.right)
      .attr("x", this._margin.left)
      .attr("y", this._margin.top)
      .attr("height", this._height - this._margin.bottom - this._margin.top)
      .attr("fill", "white")
      .attr("stroke-width", 1)
      .attr("stroke", Constants.graphContainerStrokeColor);
  }

  updateBackgroundGradient() {
    let opacity = 0.3;
    let id = "svgGradient-background";
    let crossOverPoints = this._activeConfig.makeGradientPoints();
    const t = transition().duration(100);
    this._defs
      .select("#" + id)
      .selectAll("stop")
      .transition(t)
      .attr("offset", (d, i) => {
        return crossOverPoints[i].pct;
      })
      .attr("stop-color", (d, i) => {
        return crossOverPoints[i].color;
      })
      .attr("stop-opacity", opacity);
  }

  setUpAxes(atOffset) {
    this._svgAxis = this.svg.append("g");
    var yDomain, xDomain, verticalLinesToDraw, horizontalLinesToDraw;
    let maxR0 = atOffset === -1 ? 2.0 : 2.0;
    let rDomain = [0.2, maxR0];
    let containerDomain = [0, this._data.length];
    let containerTicks = _.map(range(0, this._data.length, 1), (i) => {
      return { i: i };
    });
    const requestedMarks = [];
    if (this._activeConfig.barAxis === "y") {
      yDomain = rDomain;
      xDomain = containerDomain;
      verticalLinesToDraw = [];
      horizontalLinesToDraw = requestedMarks;
    } else {
      xDomain = rDomain;
      yDomain = containerDomain;
      verticalLinesToDraw = requestedMarks;
      horizontalLinesToDraw = [];
    }

    this.y = scaleLinear()
      .domain(yDomain)
      .range([this._height - this._margin.bottom, this._margin.top]);

    this.x = scaleLinear()
      .domain(xDomain)
      .range([this._margin.left, this._width - this._margin.right]);

    if (this._activeConfig.shouldNiceAxis) {
      this[this._activeConfig.barAxis].nice();
    }

    if (this._activeConfig.secondaryAxisFn) {
      let secondaryAxis = (g) =>
        g
          .attr("transform", this._activeConfig.secondaryAxisTranslation())
          .style("font", Constants.labelTextSize + this._fontStack)
          .attr("color", Constants.mediumGray)
          .call((g) => {
            let axis = this._activeConfig
              .secondaryAxisFn(this.x, this.y)
              .ticks(this._activeConfig.numAxisTicks())
              .tickFormat((t) => {
                if (t - Math.floor(t) === 0) {
                  return format(",.1r")(t);
                } else {
                  return format(",.1f")(t);
                }
              })
              .tickSize(0);
            return axis(g);
          })
          .call((g) => g.select(".domain").remove());
      this._svgAxis.append("g").call(secondaryAxis);
    }

    let tickAxis = (g) =>
      g
        .attr("transform", this._activeConfig.axisTranslation())
        .style("font", Constants.labelTextSize + this._fontStack)
        .attr("color", Constants.mediumGray)
        .call((g) => {
          let axis = this._activeConfig
            .axisFn(this.x, this.y)
            .ticks(this._activeConfig.numAxisTicks())
            .tickFormat((t, i, marks) => {
              if (i != 0 && i < marks.length - 1) {
                requestedMarks.push({ i: t, bold: t === 1.0 });
              }
              if (t - Math.floor(t) === 0) {
                return format(",.1r")(t);
              } else {
                return format(",.1f")(t);
              }
            })
            .tickSize(0);
          return axis(g);
        })
        .call((g) => g.select(".domain").remove())
        .call((g) => {
          let gridLines = this._svgAxis
            .selectAll("gridLines-vertical")
            .data(verticalLinesToDraw)
            .join("g");
          gridLines
            .selectAll("gridLines.line")
            .data((d) => [d])
            .join("line")
            .attr("x1", (d) => this.x(d.i))
            .attr("x2", (d) => this.x(d.i))
            .attr("y1", this._margin.top)
            .attr("y2", this._height - this._margin.bottom)
            // .attr("opacity", 0)
            .attr("stroke", (t) =>
              t.bold ? "rgba(235, 83, 88, 0.5)" : Constants.graphLineColor
            );
        })
        .call((g) => {
          let gridLines = this._svgAxis
            .selectAll("gridLines")
            .data(horizontalLinesToDraw)
            .join("g");
          gridLines
            .selectAll("gridLines.line")
            .data((d) => [d])
            .join("line")
            .attr("x1", this._margin.left)
            .attr("y1", (d) => this.y(d.i))
            .attr("x2", this._width - this._margin.right)
            .attr("y2", (d) => this.y(d.i))
            // .attr("opacity", 0)
            .attr("stroke", (t) =>
              t.bold ? "rgba(235, 83, 88, 0.5)" : Constants.graphLineColor
            );
        });
    this._svgAxis
      .append("g")
      .append("text")
      // .text("Effective Reproduction (Rt)")
      .style("font", Constants.labelTextSize + this._fontStack)
      .attr("text-anchor", "middle")
      .attr("fill", Constants.mediumGray)
      .attr("opacity", 1)
      .attr("transform", this._activeConfig.axisLabelTranslation());

    this._svgAxis.append("g").call(tickAxis);
    this.updateBackgroundGradient();

    this.bringChartToFront();
  }

  bringChartToFront() {
    let chartNode = this._chartContent.node();
    chartNode.parentNode.appendChild(chartNode);
  }

  r0ValueAtOffset(stateSeries, offset, metric) {
    let entry = _.nth(stateSeries.series, offset);
    return entry && Math.max(0, entry[metric || "r0"]);
  }

  isHoverState(identifier) {
    return this._hoverState === identifier;
  }

  isActiveState(identifier) {
    if (this._activeStates && this._activeStates.indexOf(identifier) === -1) {
      return false;
    }
    return true;
  }

  colorCodeByR(identifier, r0) {
    if (!this.isActiveState(identifier)) {
      return this._disabledColor;
    }
    return r0 >= 1 ? this._redColor : this._greenColor;
  }

  gradientForIdentifier(identifier) {
    return "url(#svgGradient-vert-" + identifier + ")";
  }

  calcBarDimension(d, offset, ciLevel) {
    let low = this.r0ValueAtOffset(d, offset, "r0_l" + ciLevel);
    let high = this.r0ValueAtOffset(d, offset, "r0_h" + ciLevel);
    let fn = this._activeConfig.barPositionFn;
    if (low !== undefined && high !== undefined) {
      return Math.abs(fn(low) - fn(high));
    } else {
      return 0;
    }
  }

  calcBarPosition(d, offset, ciLevel) {
    let low = this.r0ValueAtOffset(d, offset, "r0_l" + ciLevel);
    let high = this.r0ValueAtOffset(d, offset, "r0_h" + ciLevel);
    if (low !== undefined && high !== undefined) {
      let yPos = this._activeConfig.innerBarRelativeToAxis(low, high);
      return yPos;
    }
    return this._activeConfig.innerBarRelativeToAxis(
      this._entranceRValue,
      this._entranceRValue
    );
  }

  updateBars(offset, animate, isFirstAnim) {
    let self = this;
    this._runningUpdate = true;
    this._currentOffset = offset;
    this.rearrangeActiveGroups();
    let duration = animate ? this._animationLength : 0;
    let animFunction = easeSinOut;
    let stateColors = _.fromPairs(
      _.map(this._dataByIdentifier, (series, identifier) => {
        if (!self.isActiveState(identifier)) {
          let stroke = color(self._disabledColor);
          let opacity = 0.15;
          stroke.opacity = opacity;
          return [
            identifier,
            { fill: self._disabledColor, opacity: opacity, stroke: stroke },
          ];
        }
        let high = self.r0ValueAtOffset(series, offset, "r0_h50");
        let low = self.r0ValueAtOffset(series, offset, "r0_l50");
        let val = self.r0ValueAtOffset(series, offset, "r0");
        let fill = Util.colorCodeRt(
          identifier,
          self.r0ValueAtOffset(series, offset, "r0"),
          low,
          high
        );
        return [
          identifier,
          { fill: fill, opacity: val ? 1.0 : 0.0, stroke: fill },
        ];
      })
    );
    const t = transition().ease(animFunction).duration(duration);

    this._innerBars50
      .transition(t)
      .attr(this._activeConfig.barDimension, (d) => {
        return this.calcBarDimension(d, offset, 80);
      })
      .attr(this._activeConfig.barAxis, (d) => {
        return this.calcBarPosition(d, offset, 80);
      })
      .attr("opacity", (d) => {
        let identifier = d.identifier;
        return stateColors[identifier].opacity * self._50CIOpacity;
      })
      .attr("fill", (d) => {
        let identifier = d.identifier;
        return stateColors[identifier].fill;
      });
    this._labelGroups.transition(t).attr("transform", (d) => {
      return this._activeConfig.translationForLabelGroup(
        this.r0ValueAtOffset(d, offset) || this._entranceRValue
      );
    });
    this._labelGroups.transition(t).attr("opacity", (d) => {
      return 1.0;
    });
    this._labelRects.transition(t).attr("stroke", function (d) {
      let identifier = self.getParentIdentifier(this);
      return stateColors[identifier].stroke;
    });
    this._labelText
      .transition(t)
      .attr("fill", function (d) {
        let identifier = self.getParentIdentifier(this);
        return stateColors[identifier].fill;
      })
      .attr("opacity", function (d) {
        let identifier = self.getParentIdentifier(this);
        return stateColors[identifier].opacity;
      })
      .end()
      .then(() => {
        this._runningUpdate = false;
        var pendingOffset = this.popOffsetUpdate();
        if (pendingOffset) {
          this.updateBars(pendingOffset, true, false);
        }
        if (!isFirstAnim || !this._detectedState) {
          return;
        }
        this._labelGroups.each((d, i, el) => {
          if (d.identifier === this._detectedState) {
            let d3el = select(el[0]);
            const origTransform = d3el.attr("transform");
            let bounceTiming = 1000;
            let count = 1;
            let limit = 3;
            d3el
              .transition()
              .duration(bounceTiming)
              .on("start", function repeat() {
                count++;
                let transition = active(this)
                  .attr(
                    "transform-origin",
                    self._bubbleWidth / 2 +
                      "px " +
                      self._activeConfig.labelYOffset +
                      "px"
                  )
                  .attr("transform", origTransform + " scale(1.25)")
                  .transition()
                  .duration(bounceTiming)
                  .attr("transform", origTransform + " scale(1.0)");
                if (count < limit) {
                  transition
                    .transition()
                    .duration(bounceTiming)
                    .on("start", repeat);
                }
              });
          }
        });
      });
  }

  rearrangeActiveGroups() {
    this._outerBars.sort((a, b) => {
      let aID = a["identifier"];
      let bID = b["identifier"];
      let aSort = a["sort"];
      let bSort = b["sort"];
      if (this.isHoverState(aID) || aID === this._detectedState) {
        return 1;
      } else if (this.isHoverState(bID) || bID === this._detectedState) {
        return -1;
      } else {
        return aSort - bSort;
      }
    });
  }

  renderBars() {
    let self = this;
    let chartContent = this._chartContent;
    const barGroups = chartContent
      .selectAll("bargroups")
      .data([this._data])
      .join("g");

    this._outerBars = barGroups
      .selectAll("bars.outer")
      .data((d) => d)
      .join("g")
      .attr(this._activeConfig.containerDimension, this._eachStateWidth)
      .attr(this._activeConfig.barDimension, (d) => {
        return this._contentHeight;
      })
      .attr("transform", (d) => this._activeConfig.translateOuterBar(d));
    this._innerBars50 = this._outerBars
      .selectAll("bars.inner50")
      .data((d) => [d])
      .join("rect")
      .attr(
        this._activeConfig.containerDimension,
        Math.min(10, this._eachStateWidth * 0.4)
      )
      .attr("rx", 5)
      .attr(this._activeConfig.containerAxis, function (d) {
        let d3el = select(this);
        let measure = d3el.attr(self._activeConfig.containerDimension);
        return self._activeConfig.innerBarRelativeToContainer(measure);
      });

    this._labelGroups = this._outerBars
      .selectAll("bars.labelGroup")
      .data((d) => [d])
      .join("g");

    let rectX = function () {
      let el = select(this);
      return (self._eachStateWidth - el.attr("width")) / 2;
    };
    let rectY = function () {
      let d3el = select(this);
      return self._activeConfig.labelRectPosition(d3el.attr("height"));
    };
    this._labelRects = this._labelGroups
      .selectAll("bars.labelGroup.rect")
      .data((d) => [d])
      .join("rect")
      .attr("width", this._bubbleWidth)
      .attr("height", this._bubbleHeight)
      .attr("rx", 8.5)
      .attr("fill", "white")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseover", function (d) {
        self._hoverState = d.identifier;
        let el = select(this);
        let width = self._bubbleWidth * 1.1;
        let height = self._bubbleHeight * 1.1;
        el.attr("width", width)
          .attr("height", height)
          .attr("rx", 8.5 * 1.1)
          .attr("x", rectX)
          .attr("y", rectY);
        self.rearrangeActiveGroups();
        let offset = this.getCTM();
        let state = el.datum()["identifier"];
        let val = self.r0ValueAtOffset(d, self._currentOffset, "r0");
        self._onStateMouseover({
          x: offset.e + width / 2 + 1,
          y: offset.f - self._bubbleHeight - 2,
          state: state,
          r0: val,
          high: self.r0ValueAtOffset(d, self._currentOffset, "r0_h80"),
          low: self.r0ValueAtOffset(d, self._currentOffset, "r0_l80"),
        });
      })
      .on("mouseout", function (d) {
        self._hoverState = null;
        let el = select(this);
        el.attr("width", self._bubbleWidth)
          .attr("height", self._bubbleHeight)
          .attr("x", rectX)
          .attr("y", rectY);
        self.rearrangeActiveGroups();
        self._onStateMouseOut();
      })
      .on("click", (d, i) => {
        this._onStateClicked(d.identifier);
      })
      .attr("x", rectX)
      .attr("y", rectY);
    this._labelText = this._labelGroups
      .selectAll("bars.labelGroup.text")
      .data((d) => [d])
      .join("text")
      .attr("font-family", this._fontStack)
      .attr("font-weight", "600")
      .attr("font-size", Constants.statePillTextSize)
      .attr("pointer-events", "none")
      .attr("height", 28)
      .attr("text-anchor", "middle")
      .text(function () {
        return self.getParentIdentifier(this);
      })
      .attr("x", (d) => {
        return 12 + (this._eachStateWidth - this._bubbleWidth) / 2;
      })
      .attr("y", function () {
        return self._activeConfig.labelYOffset;
      });
  }

  getParentIdentifier(svgElem) {
    let parent = svgElem.parentNode;
    let parentData = select(parent).datum();
    return parentData["identifier"];
  }

  queueOffsetUpdate(offset) {
    this._offsetQueue.push(offset);
  }

  popOffsetUpdate() {
    return this._offsetQueue.pop();
  }

  setDaysOffset(offset) {
    if (this._svgAxis) {
      this._svgAxis.remove();
      this.setUpAxes(offset);
    }
    if (!this._runningUpdate) {
      this.updateBars(offset, true, false);
    } else {
      this.queueOffsetUpdate(offset);
    }
  }

  setActiveStates(activeStates, allowRender) {
    this._activeStates = activeStates;
    if (this._data && allowRender) {
      this.updateBars(this._currentOffset, true, false);
    }
  }

  render(data, eachStateWidth, verticalMode, detectedState) {
    if (!data.length) {
      return;
    }
    this._data = data;
    this._dataByIdentifier = _.keyBy(data, (state) => state["identifier"]);
    this._eachStateWidth = eachStateWidth;
    this._activeConfig = verticalMode ? this.Vertical : this.Horizontal;
    this._detectedState = detectedState;
    this._margin = this._activeConfig.margin;

    this.svg.selectAll("g").remove();
    this.svg.selectAll("rect").remove();

    this._defs = this.svg.append("defs");
    this._chartContent = this.svg.append("g");
    this.setUpBackground();
    this.setUpAxes(-1 - Constants.daysOffsetSinceEnd);
    this.setUpSVGDefs();
    this.renderBars();

    this.updateBars(this._currentOffset, false, true);
  }
}
