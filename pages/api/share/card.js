import S3 from "aws-sdk/clients/s3";
import { CDN_ROOT, LOOPBACK_BASE_URL } from "config/PageConfig";
import PageConfig from "config/PageConfig";
import { ScreenshotUtil } from "lib/ScreenshotUtil";
import DataFetcher from "lib/DataFetcher";

const url = require("url");
const NodeCache = require("node-cache");
const LocalCache = new NodeCache();

// access key ID & secret are stored in ~/.aws/credentials by Docker (or you can put them in manually on your devbox)
const s3 = new S3();

function wait(milleseconds) {
  return new Promise((resolve) => setTimeout(resolve, milleseconds));
}

function releaseLock(lockKey) {
  LocalCache.del(lockKey);
}

async function getLock(lockKey, secondsToWait) {
  var counter = 0;
  while (true) {
    if (!LocalCache.has(lockKey)) {
      LocalCache.set(lockKey, 1, 10);
      return;
    } else {
      counter++;
      if (counter > secondsToWait) {
        throw new Error("Couldn't lock");
      }
      await wait(1000);
    }
  }
}

async function getLastRunDate(config) {
  let cdnURL = new DataFetcher(config).getDataURL();
  let keyPath = url.parse(cdnURL).path.slice(1);
  let params = {
    Bucket: "spectredata",
    Key: keyPath,
  };
  let result = await s3.headObject(params).promise();
  return new Date(result.LastModified).getTime();
}

function writeRedirect(res, imageURL) {
  res.writeHead(302, "Moved", { Location: imageURL });
  res.end();
}

export default async (req, res) => {
  let area = req.query["area"];
  let subarea = req.query["subarea"];
  if (!area || !subarea) {
    res.statusCode = 400;
    res.end(JSON.stringify({ err: "missing parameters" }));
    return;
  }
  let config = PageConfig[area];
  if (!config) {
    res.statusCode = 400;
    res.end(JSON.stringify({ err: "bad area" }));
    return;
  }
  let lastRunID = await getLastRunDate(config);
  let imageURL = config.getCDNURLForShareImage(subarea, lastRunID);
  let keyPath = url.parse(imageURL).path.slice(1);
  var params = {
    Bucket: "spectredata",
    Key: keyPath,
  };
  let lockKey = `lock:${imageURL}`;
  let imageURLCacheKey = `image-exists:${imageURL}`;
  if (LocalCache.get(imageURLCacheKey)) {
    writeRedirect(res, imageURL);
    return;
  }
  await getLock(lockKey, 10);
  try {
    await s3.headObject(params).promise();
  } catch (e) {
    if (e.statusCode != 404) {
      // unhandled S3 error
      res.statusCode = 500;
      res.end(JSON.stringify({ err: e }));
      return;
    } else {
      // we got a 404, so we need to generate this image
      let exportURL = `${LOOPBACK_BASE_URL}/export/${area}?subarea=${subarea}`;
      let imageBuffer = await new ScreenshotUtil(
        exportURL
      ).captureImageAsBuffer(exportURL, 0);
      if (req.query["dryrun"] === "true") {
        res.end(imageBuffer);
        releaseLock(lockKey);
        return;
      } else {
        await s3
          .putObject({
            Body: imageBuffer,
            Key: keyPath,
            Bucket: params.Bucket,
            ContentType: "image/png",
          })
          .promise();
      }
    }
  }
  releaseLock(lockKey);
  LocalCache.set(imageURLCacheKey, true, 60 * 60);
  writeRedirect(res, imageURL);
  return;
};
