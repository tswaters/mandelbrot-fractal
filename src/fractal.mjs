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

const mandelbrotx = [-2.0, 2.0];
const mandelbroty = [-2.0, 2.0];

const doWork = (x0, y0, sw, sh) => {
  const worker = new Worker("./fractal-worker.mjs");
  const imgData = ctx.getImageData(x0, y0, sw, sh);
  var id = `{${x0}, ${y0}} - ${sw}x${sh}`; // var by design, hoist
  console.time(id);

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

  return new Promise((resolve) => {
    worker.onmessage = ({ data }) => {
      worker.terminate();
      console.timeEnd(id);
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

  const w2 = Math.ceil(width / 4);
  const h2 = Math.ceil(height / 4);

  Promise.all([
    doWork(w2 * 0, h2 * 0, w2, h2),
    doWork(w2 * 0, h2 * 1, w2, h2),
    doWork(w2 * 0, h2 * 2, w2, h2),
    doWork(w2 * 0, h2 * 3, w2, h2),
    doWork(w2 * 1, h2 * 0, w2, h2),
    doWork(w2 * 1, h2 * 1, w2, h2),
    doWork(w2 * 1, h2 * 2, w2, h2),
    doWork(w2 * 1, h2 * 3, w2, h2),
    doWork(w2 * 2, h2 * 0, w2, h2),
    doWork(w2 * 2, h2 * 1, w2, h2),
    doWork(w2 * 2, h2 * 2, w2, h2),
    doWork(w2 * 2, h2 * 3, w2, h2),
    doWork(w2 * 3, h2 * 0, w2, h2),
    doWork(w2 * 3, h2 * 1, w2, h2),
    doWork(w2 * 3, h2 * 2, w2, h2),
    doWork(w2 * 3, h2 * 3, w2, h2),
  ])
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
