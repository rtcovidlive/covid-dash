import axios from "axios";

import { decode } from "@ygoe/msgpack";
import { Util } from "./Util";

export class RTData {
  constructor(dataSeries, modelLastRunDate, lastRTValueDate) {
    this.dataSeries = dataSeries;
    this.modelLastRunDate = modelLastRunDate;
    this.lastRTValueDate = lastRTValueDate;
  }
}

export default class DataFetcher {
  constructor(areaConfig) {
    this._config = areaConfig;
  }

  getDataURL(modelOverride) {
    let suffix = modelOverride ? "_" + modelOverride : "_release";
    // return `${this._config.dataURLBase}${suffix}.pack.gz`;
    return `${this._config.dataURLBase}${suffix}.pack`;
  }

  fetchLatest(modelOverride) {
    return new Promise(async (resolve, reject) => {
      try {
        let rawResponse = await axios.get(this.getDataURL(modelOverride), {
          responseType: "arraybuffer",
        });
        var responseData = decode(rawResponse.data);
      } catch (err) {
        Sentry.captureException(new Error(err));
        reject(err);
        return;
      }
      let rtData = new RTData(
        responseData.state_data,
        new Date(responseData.last_updated_ts),
        Util.dateFromISO(responseData.last_r0_date)
      );
      resolve(rtData);
      window.ga &&
        window.ga(
          "send",
          "event",
          "data-freshness",
          "ts",
          responseData.last_updated_ts
        );
    });
  }
}
