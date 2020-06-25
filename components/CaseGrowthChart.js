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
import CaseGrowthViz from "visualization/CaseGrowthViz";
import { Util } from "lib/Util";

const TopLegendContainer = styled(LegendContainer)`
  top: 0px;
`;

const BottomLegendContainer = styled(LegendContainer)`
  bottom: 80px;
`;

export class CaseGrowthChart extends RTSubareaChart {
  constructor(props) {
    super(props);
    this._vizClass = CaseGrowthViz;
  }

  renderLegend() {
    return (
      <>
        <BottomLegendContainer>
          <LegendRow>
            <LegendLine backgroundColor={this.state.viz._testChartBars} />
            <LegendLabel>Testing Volume</LegendLabel>
          </LegendRow>
        </BottomLegendContainer>
      </>
    );
  }

  handleMouseover(data) {
    let tooltipContents = (
      <TooltipWrapper>
        <TooltipDate>
          {this._timeFormat(Util.dateFromISO(data.dataPoint.date))}
        </TooltipDate>
        <TooltipLabel>Positive (Reported)</TooltipLabel>
        <TooltipStat color={this.state.viz._mainChartStroke} opacity={0.7}>
          {this._numberFormat(data.dataPoint.cases_new)}
        </TooltipStat>
        <TooltipLabel>Testing Volume</TooltipLabel>
        <TooltipStat color={this.state.viz._testChartDark}>
          {this._numberFormat(data.dataPoint.tests_new)}
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
