const puppeteer = require("puppeteer");
import { file } from "tmp-promise";

const fs = require("fs").promises;

export class ScreenshotUtil {
  constructor(url) {
    this._url = url;
  }
  async screenshotDOMElements(path, page, selector, padding = 0) {
    let writtenPaths = [];
    const objs = await page.evaluate((selector) => {
      const elements = document.querySelectorAll(selector);
      let ret = [];
      for (var element of elements) {
        const { x, y, width, height } = element.getBoundingClientRect();
        let attributes = {};
        for (
          var i = 0, atts = element.attributes, n = atts.length, arr = [];
          i < n;
          i++
        ) {
          attributes[atts[i].nodeName] = atts[i].nodeValue;
        }
        ret.push({
          left: x,
          top: y,
          width,
          height,
          id: element.id,
          attributes: attributes,
        });
      }
      return ret;
    }, selector);

    for (var obj of objs) {
      let p;
      if (typeof path === "string" || path instanceof String) {
        p = path;
      } else {
        p = path(obj);
      }
      await page.screenshot({
        path: p,
        clip: {
          x: obj.left - padding,
          y: obj.top - padding,
          width: obj.width + padding * 2,
          height: obj.height + padding * 2,
        },
      });
      writtenPaths.push(p);
    }
    return writtenPaths;
  }
  pathFromElementData(p) {
    const key = p.attributes["data-image-key"];
    let imageName;
    if (keyCounter[key] == undefined) {
      imageName = key;
      keyCounter[key] = 1;
    } else {
      imageName = `${key}_${keyCounter[key]}`;
      keyCounter[key] += 1;
    }

    return `${writeDir}/${imageName}.png`;
  }

  async captureImageAsBuffer(url, padding) {
    const browser = await puppeteer.launch({
      args: [
        // Required for Docker version of Puppeteer
        "--no-sandbox",
        "--disable-setuid-sandbox",
        // This will write shared memory files into /tmp instead of /dev/shm,
        // because Docker’s default for /dev/shm is 64MB
        "--disable-dev-shm-usage",
      ],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForSelector(".image-me");
    const bodyHandle = await page.$("body");
    const boundingBox = await bodyHandle.boundingBox();
    const defaultViewport = {
      height: 1920,
      width: 600,
      deviceScaleFactor: 2,
    };

    const newViewport = {
      width: Math.max(defaultViewport.width, Math.ceil(boundingBox.width)),
      height: Math.max(defaultViewport.height, Math.ceil(boundingBox.height)),
    };
    await page.setViewport(Object.assign({}, defaultViewport, newViewport));
    page.on("console", (msg) => console.log("PAGE LOG:", msg));

    const keyCounter = {};

    const { fd, path, cleanup } = await file({ postfix: ".png" });
    await this.screenshotDOMElements(path, page, ".image-me", padding);
    await browser.close();
    let handle = await fs.open(path);
    let buffer = await handle.readFile();
    await handle.close();
    cleanup();
    return buffer;
  }
}
