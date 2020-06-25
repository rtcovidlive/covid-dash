const puppeteer = require("puppeteer");
const yargs = require("yargs")
  .option("s", {
    alias: "start-next",
    describe: "Start a next server for the site",
    type: "boolean",
    nargs: 0,
    default: false,
  })
  .option("p", {
    alias: "port",
    describe: "Port",
    type: "number",
    nargs: 1,
    default: 3000,
  })
  .option("o", {
    alias: "output",
    describe: "Output directory",
    type: "string",
    nargs: 1,
    default: "./tmp",
  });
const fs = require("fs");
const execa = require("execa");

function wait(milleseconds) {
  return new Promise((resolve) => setTimeout(resolve, milleseconds));
}

function withNextContext(readyTimeout, port, fn) {
  (async () => {
    let ready = {};
    console.log("Starting next server...");
    const subprocess = execa(
      "node",
      ["node_modules/.bin/next", "dev", "-p", port],
      { buffer: false }
    );
    subprocess.stderr.pipe(process.stderr);
    subprocess.stdout.on("data", (data) => {
      if (data.includes("ready on") && ready.ready === undefined) {
        ready.ready = true;
        (async () => {
          console.log("Server ready... starting commands");
          await fn();
          subprocess.cancel();
        })();
      }
    });

    let waited = 0;
    while (true && !ready.ready) {
      if (waited > readyTimeout) {
        console.error("Timed out waiting for server to be ready...");
        ready.ready = false;
        subprocess.cancel();
        await wait(5000);
        process.exit(1);
      } else if (subprocess.failed) {
        ready.ready = false;
        console.error("Next server failed");
        process.exit(1);
      }

      console.log("Waiting for server to be ready...");
      await wait(1000);
      waited += 1000;
    }
  })();
}

async function screenshotDOMElements(path, page, selector, padding = 0) {
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
    console.log("Writing " + p);
  }
}

async function captureSiteImages(writeDir, url, padding) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
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
  await screenshotDOMElements(
    function (p) {
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
    },
    page,
    ".image-me",
    padding
  );
  await browser.close();
}

(async () => {
  const writeDir = yargs.argv.output;
  const port = yargs.argv.port;
  const url = `http://localhost:${port}/export/us`;
  const padding = 5;
  const readyTimeout = 20 * 1000;

  if (!fs.existsSync(writeDir)) {
    fs.mkdirSync(writeDir);
  }

  if (yargs.argv.startNext) {
    withNextContext(readyTimeout, port, async () => {
      await captureSiteImages(writeDir, url, padding);
      process.exit(0);
    });
  } else {
    await captureSiteImages(writeDir, url, padding);
  }
})();
