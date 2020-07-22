function ConstantsInternal() {
  this.IndexingOptions = {
    ByDate: "By date",
    IndexedToCaseThreshold: "Days since crossing 50 cases",
    IndexedToDeathThreshold: "Days since crossing 10 deaths",
    IndexedToIntervention: "Days since first intervention",
  };

  this.InterventionTypes = {
    ShelterInPlace: "shelter-in-place",
    ShelterEnded: "shelter-ended",
    Reopening: "reopen",
  };

  this.InterventionTypeLabels = {
    "shelter-in-place": "Shelter Started",
    "shelter-ended": "Shelter Ended",
    reopen: "Reopening",
  };

  this.MetricOptions = {
    ReportedCases: "Reported cases",
    ReportedNewCases: "New cases",
    TestCorrectedCases: "Test-adjusted new cases",
    ReportedDeaths: "Reported deaths",
    ReportedNewDeaths: "New deaths",
    PredictedCases: "Predicted total cases",
    PredictedDeaths: "Predicted total deaths",
    PredictedActive: "Predicted active cases",
    DerivedR0: "Infection rate",
    TrueInfections: "True infections",
    TrueInfectionsPC: "True infections per 100k",
    Seroprevalence: "Seroprevalence",
  };
  this.CompareMode = {
    Cases: {
      label: "Cases",
      metric: this.MetricOptions.ReportedCases,
      indexing: this.IndexingOptions.ByDate,
    },
    Deaths: {
      label: "Deaths",
      metric: this.MetricOptions.ReportedDeaths,
      indexing: this.IndexingOptions.IndexedToDeathThreshold,
    },
    R0: {
      label: "Infection Rate",
      metric: this.MetricOptions.DerivedR0,
      indexing: this.IndexingOptions.ByDate,
    },
  };

  this.AnnotationsSeries = "interventions";

  this.DateMaxOptions = {
    "1w": new Date(new Date().setHours(0, 0, 0) + 7 * 24 * 60 * 60 * 1000),
    "1m": new Date(new Date().setHours(0, 0, 0) + 30 * 24 * 60 * 60 * 1000),
    "2m": new Date(new Date().setHours(0, 0, 0) + 60 * 24 * 60 * 60 * 1000),
    Max: new Date(2020, 8, 3),
  };

  this.daysOffsetSinceEnd = 0;

  this.mainWidth = "92%";
  this.veryLightGray = "rgba(0,0,0,0.03)";
  this.lightGray = "rgba(0,0,0,0.3)";
  this.mediumGray = "rgba(0,0,0,0.4)";
  this.blueAnnounceColor = "rgba(50, 197, 255, 1.0)";
  this.redColor = "rgba(235, 83, 88, 1.0)";
  this.greenColor = "rgba(53, 179, 46, 1.0)";
  this.yellowColor = "rgba(247, 181, 1, 1.0)";
  this.grayColor = "#bbb";
  this.graphLineColor = "rgba(0, 0, 0, 0.05)";
  this.boldGraphLineColor = "rgba(0, 0, 0, 0.3)";
  this.graphContainerStrokeColor = "#eee";
  this.labelTextSize = "12px";
  this.statePillTextSize = "10px";
  this.fontStack =
    '"SF Pro Text",-apple-system, BlinkMacSystemFont,"Helvetica Neue","Helvetica","Segoe UI", "Arial",sans-serif';
}
const Constants = new ConstantsInternal();

export default Constants;
