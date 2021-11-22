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

  worker.onmessage = ({ data }) => {
    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(data), sw, sh),
      x0,
      y0
    );
    worker.terminate();
    console.timeEnd(id);
  };
};

const redraw = () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;

  const w2 = Math.ceil(width / 4);
  const h2 = Math.ceil(height / 2);

  doWork(w2 * 0, 0, w2, h2);
  doWork(w2 * 0, h2, w2, h2);
  doWork(w2 * 1, 0, w2, h2);
  doWork(w2 * 1, h2, w2, h2);
  doWork(w2 * 2, 0, w2, h2);
  doWork(w2 * 2, h2, w2, h2);
  doWork(w2 * 3, 0, w2, h2);
  doWork(w2 * 3, h2, w2, h2);
};

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("fractal");
  ctx = canvas.getContext("2d");
  redraw();
});

window.addEventListener("resize", redraw);
