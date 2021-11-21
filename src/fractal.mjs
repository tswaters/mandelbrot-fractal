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
const MAX_ITERATIONS = 1000;

const scale = ([r0, r1], value, total) => value * ((r1 - r0) / total);

const calculate = (width, height, px, py) => {
  let x0 = scale(mandelbrotx, px - width / 2, width);
  let y0 = scale(mandelbroty, py - height / 2, width);
  let x = 0;
  let y = 0;
  let iteration = 0;

  while (x * x + y * y <= 4 && iteration < MAX_ITERATIONS) {
    var x_new = x * x - y * y + x0;
    y = 2 * x * y + y0;
    x = x_new;
    iteration++;
  }

  return iteration;
};

const updateWidth = () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
};

const redraw = () => {
  updateWidth();
  ctx.clearRect(0, 0, width, height);

  const canvasData = ctx.createImageData(width, height);
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      const index = (x + y * width) * 4;
      const iteration = calculate(width, height, x, y);
      const r = iteration === MAX_ITERATIONS ? 255 : 0;
      canvasData.data[index + 0] = r;
      canvasData.data[index + 1] = r;
      canvasData.data[index + 2] = r;
      canvasData.data[index + 3] = 255;
    }
  }

  ctx.putImageData(canvasData, 0, 0);
};

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("fractal");
  ctx = canvas.getContext("2d");
  redraw();
});

window.addEventListener("resize", redraw);
