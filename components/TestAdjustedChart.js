import styled from "styled-components";
import {
  TooltipWrapper,
  TooltipDate,
  TooltipStat,
  TooltipLabel,
  RTSubareaChart,
  LegendContainer,
  LegendRow,
  LegendLine,
  LegendLabel,
} from "./RTSubareaChart";
import { Util } from "lib/Util";
import TestAdjustedViz from "visualization/TestAdjustedViz";

const TopLegendContainer = styled(LegendContainer)`
  top: 12px;
`;

const BottomLegendContainer = styled(LegendContainer)`
  bottom: 80px;
`;
export class TestAdjustedChart extends RTSubareaChart {
  constructor(props) {
    super(props);
    this._vizClass = TestAdjustedViz;
  }

  renderLegend() {
    return (
      <>
        <TopLegendContainer>
          <LegendRow>
            <LegendLine backgroundColor={this.state.viz._mainChartBars} />
            <LegendLabel>Adjusted Positive</LegendLabel>
          </LegendRow>
          <LegendRow>
            <LegendLine
              backgroundColor={this.state.viz._mainChartCountStroke}
            />
            <LegendLabel>De-noised Adjusted Positive</LegendLabel>
          </LegendRow>
          <LegendRow>
            <LegendLine
              backgroundColor={this.state.viz._mainChartInfectionStroke}
            />
            <LegendLabel>Implied Infections</LegendLabel>
          </LegendRow>
        </TopLegendContainer>
      </>
    );
  }

  handleMouseover(data) {
    let tooltipContents = (
      <TooltipWrapper>
        <TooltipDate>
          {this._timeFormat(Util.dateFromISO(data.dataPoint.date))}
        </TooltipDate>
        <TooltipLabel>Adjusted Positive</TooltipLabel>
        <TooltipStat color={this.state.viz._mainChartCountStroke} opacity={0.6}>
          {this._numberFormat(data.dataPoint.corr_cases_raw)}
        </TooltipStat>
        <TooltipLabel>De-noised Adjusted Positive</TooltipLabel>
        <TooltipStat color={this.state.viz._mainChartCountStroke} opacity={0.9}>
          {this._numberFormat(data.dataPoint.corr_cases_new)}
        </TooltipStat>
        <TooltipLabel>Implied Infections</TooltipLabel>
        <TooltipStat
          color={this.state.viz._mainChartInfectionStroke}
          opacity={0.7}
        >
          {this._numberFormat(data.dataPoint.onsets)}
        </TooltipStat>
      </TooltipWrapper>
    );
    this.setState({
      tooltipX: data.x,
      tooltipY: data.y,
      tooltipShowing: true,
      tooltipContents: tooltipContents,
    });
  }
}
