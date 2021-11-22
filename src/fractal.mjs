import { scale } from "./util.mjs";

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
let ratio;

let lastData;

const DEBUG = false;
let scalex = [-2.0, 2.0];
let scaley = [-2.0, 2.0];

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
  const id = `{${x0}, ${y0}} - ${sw}x${sh}`;
  if (DEBUG) console.time(id);

  return new Promise((resolve) => {
    const worker = new Worker("./fractal-worker.mjs", { type: "module" });
    const imgData = ctx.getImageData(x0, y0, sw, sh);

    worker.postMessage(
      {
        pixels: imgData.data.buffer,
        scalex,
        scaley,
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

const recalculate = () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  ratio = width / height;

  chunkWork(width, height, 4, 4, doWork)
    .then((work) => redraw(work))
    .catch((err) => console.error({ err }, "oopsie"));
};

const redraw = (work = lastData) => {
  lastData = work;
  ctx.clearRect(0, 0, width, height);
  lastData.forEach((item) => ctx.putImageData(item.data, item.x, item.y));

  ctx.font = "1vw sans serif";
  ctx.fillStyle = "green";
  ctx.textBaseline = "top";
  ctx.fillText(`width: ${width}, height: ${height}`, 5, 5);
  ctx.fillText(
    `x: [${scalex[0]}, ${scalex[1]}], y: [${scaley[0]}, ${scaley[1]}]`,
    5,
    30
  );
};

let dragging = false;
let dragx = null;
let dragy = null;

const handleMouseDown = (e) => {
  dragging = true;
  dragx = e.clientX;
  dragy = e.clientY;
};

const handleMouseUp = (e) => {
  let h = e.clientY - dragy;
  let w = h * ratio;

  scalex = [
    scale(scalex, dragx - width / 2, width),
    scale(scalex, dragx + w - width / 2, width),
  ];

  scaley = [
    scale(scaley, dragy - height / 2, height),
    scale(scaley, dragy + h - height / 2, height),
  ];

  recalculate();

  dragging = false;
  dragx = null;
  dragy = null;
};

const handleMouseMove = (e) => {
  if (dragging === false) return;

  let h = e.clientY - dragy;
  let w = h * ratio;

  redraw();

  ctx.strokeStyle = "blue";
  ctx.strokeRect(dragx, dragy, w, h);
};

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("fractal");
  ctx = canvas.getContext("2d");
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mousemove", handleMouseMove);
  recalculate();
});

window.addEventListener("resize", recalculate);
