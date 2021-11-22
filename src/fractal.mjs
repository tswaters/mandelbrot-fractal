/**
 * @type {HTMLCanvasElement}
 */
let canvas;

/**
 * @type {CanvasRenderingContext2D}
 */
let ctx;

let width;
let height;

const DEBUG = false;
const mandelbrotx = [-2.0, 2.0];
const mandelbroty = [-2.0, 2.0];

const chunkWork = (width, height, xslice, yslice, cb) => {
  const cw = Math.ceil(width / xslice);
  const ch = Math.ceil(height / yslice);
  const promises = [];
  for (let i = 0; i < xslice; i += 1) {
    for (let j = 0; j < yslice; j += 1) {
      promises.push(cb(cw * i, ch * j, cw, ch));
    }
  }
  return Promise.all(promises);
};

const doWork = (x0, y0, sw, sh) => {
  if (DEBUG) {
    var id = `{${x0}, ${y0}} - ${sw}x${sh}`; // var by design, hoist
    console.time(id);
  }
  return new Promise((resolve) => {
    const worker = new Worker("./fractal-worker.mjs");
    const imgData = ctx.getImageData(x0, y0, sw, sh);

    worker.postMessage(
      {
        pixels: imgData.data.buffer,
        scalex: mandelbrotx,
        scaley: mandelbroty,
        sw,
        sh,
        width,
        height,
        px: x0,
        py: y0,
      },
      [imgData.data.buffer]
    );

    worker.onmessage = ({ data }) => {
      worker.terminate();
      if (DEBUG) console.timeEnd(id);
      resolve({
        data: new ImageData(new Uint8ClampedArray(data), sw, sh),
        x: x0,
        y: y0,
      });
    };
  });
};

const redraw = () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;

  chunkWork(width, height, 4, 4, doWork)
    .then((work) =>
      work.forEach((item) => ctx.putImageData(item.data, item.x, item.y))
    )
    .catch((err) => console.error({ err }, "oopsie"));
};

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("fractal");
  ctx = canvas.getContext("2d");
  redraw();
});

window.addEventListener("resize", redraw);
