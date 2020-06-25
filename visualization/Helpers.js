import _ from "lodash";
import Constants from "lib/Constants";
import { Util } from "lib/Util";

const Helpers = {
  BrowserText: (function () {
    /**
     * Measures the rendered width of arbitrary text given the font size and font face
     * @param {string} text The text to measure
     * @param {number} fontSize The font size in pixels
     * @param {string} fontFace The font face ("Arial", "Helvetica", etc.)
     * @returns {number} The width of the text
     **/
    function getWidth(text, fontSize, fontFace) {
      if (typeof fontSize === typeof 1) {
        fontSize = fontSize + "px";
      }
      var canvas = document.createElement("canvas"),
        context = canvas.getContext("2d");
      context.font = `${fontSize} ${fontFace}`;
      return context.measureText(text).width;
    }

    return {
      getWidth: getWidth,
    };
  })(),

  getYAxisOffset: function (width) {
    return width > 600 ? 8 : 0;
  },

  getAxisFontSize: function (width) {
    return width > 600 ? "11px" : "11px";
  },

  renderAnnotations: function (
    chartContent,
    indexFn,
    x,
    y,
    targetMetrics,
    defaultOpacity,
    fontSize
  ) {
    if (!Array.isArray(targetMetrics)) {
      targetMetrics = [targetMetrics];
    }
    const flipDirectionThreshold = (x.range()[1] - x.range()[0]) / 3;
    function shouldFlipDirection(dateX) {
      return dateX < flipDirectionThreshold;
    }
    function maxMetricY(entry) {
      let max = _.max(
        _.map(targetMetrics, (targetMetric) => entry[targetMetric])
      );
      return y(max);
    }
    function actualXOffset(entry, textLength = 0) {
      let xOffset = 0;
      let dateX = x(indexFn(entry)) + 2.0;
      if (shouldFlipDirection(dateX)) {
        // TODO
        return dateX + xOffset + textLength;
      } else {
        return dateX - xOffset - textLength;
      }
    }

    var lastPosition = null;
    function actualYOffset(entry, index) {
      if (index === 0) {
        lastPosition = null;
      }
      let offsets = [-85, -75, -95];
      let dataPointY = maxMetricY(entry);
      let calculated = Math.max(
        15,
        dataPointY + offsets[index % offsets.length]
      );
      let xOffset = actualXOffset(entry);
      if (
        lastPosition &&
        Math.abs(lastPosition[0] - xOffset) < 150 &&
        Math.abs(lastPosition[1] - calculated) < 150
      ) {
        calculated -= 20;
      }
      lastPosition = [xOffset, calculated];
      return calculated;
    }
    const lineColor = "rgba(0,0,0,0.20)";
    let shelterGroups = chartContent
      .selectAll("interventions.groups")
      .data((d) => {
        return [
          _.filter(
            d.series,
            (d) => d.annotations && Util.dateFromISO(d.date) < x.domain()[1]
          ),
        ];
      })
      .join("g")
      .attr("opacity", defaultOpacity);

    shelterGroups
      .selectAll("interventions.path.underline")
      .data((d) => {
        return d;
      })
      .join("line")
      .attr("x1", (d) => {
        let label =
          Constants.InterventionTypeLabels[d.annotations[0].type] ||
          d.annotations[0].type;
        let textLength = this.BrowserText.getWidth(
          label,
          fontSize,
          Constants.fontStack
        );
        return actualXOffset(d, textLength);
      })
      .attr("x2", (d) => {
        return actualXOffset(d);
      })
      .attr("y1", (d, i) => {
        return actualYOffset(d, i);
      })
      .attr("y2", (d, i) => {
        return actualYOffset(d, i);
      })
      .attr("opacity", 1.0)
      .attr("stroke-width", "1px")
      .attr("stroke", lineColor);
    shelterGroups
      .selectAll("interventions.path.mousearea")
      .data((d) => {
        return d;
      })
      .join("line")
      .attr("x1", (d) => {
        return actualXOffset(d);
      })
      .attr("x2", (d) => {
        return actualXOffset(d);
      })
      .attr("y1", (d, i) => {
        return actualYOffset(d, i);
      })
      .attr("y2", (d) => {
        return Math.max(5, maxMetricY(d));
      })
      .attr("opacity", 1.0)
      .attr("stroke-width", "1px")
      .attr("stroke", lineColor);
    shelterGroups
      .selectAll("interventions.labels")
      .data((d) => d)
      .join("text")
      .text((d) => {
        return (
          Constants.InterventionTypeLabels[d.annotations[0].type] ||
          d.annotations[0].type
        );
      })
      .attr("fill", Constants.mediumGray)
      .attr("text-anchor", (d) => {
        return shouldFlipDirection(x(indexFn(d))) ? "start" : "end";
      })
      .style("font-size", fontSize)
      .attr("transform", (d, i) => {
        let offset = shouldFlipDirection(x(indexFn(d))) ? 2 : -2;
        return Util.makeTranslation(
          actualXOffset(d) + offset,
          actualYOffset(d, i) - 4,
          0
        );
      });
    return shelterGroups;
  },

  addGradientDef: function (chartContent, yFn, height) {
    let redColor = "rgba(235, 83, 88, 1.0)";
    let greenColor = "rgba(53, 179, 46, 1.0)";
    const defs = chartContent.append("defs");
    let uuid = Util.uuidV4();
    let backgroundGradientID = "svgGradient-vert-" + uuid;
    let lineGradientID = "svgGradient-line" + uuid;
    let crossOver = (yFn(1.0) / height) * 100 + "%";
    var backgroundGradient = defs
      .append("linearGradient")
      .attr("id", backgroundGradientID)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");
    var lineGradient = defs
      .append("linearGradient")
      .attr("id", lineGradientID)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");
    let crossOverPoints = [
      { color: redColor, lightColor: "#FCF2F2", pct: "0%" },
      { color: redColor, lightColor: "#FCF2F2", pct: crossOver },
      { color: greenColor, lightColor: "#F2F9F0", pct: crossOver },
      { color: greenColor, lightColor: "#F2F9F0", pct: "100%" },
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
    return [lineGradientID, backgroundGradientID];
  },
};

export default Helpers;
