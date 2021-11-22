/* eslint-env worker */

// escape time algo

const MAX_ITERATIONS = 500;

const scale = ([r0, r1], value, total) => value * ((r1 - r0) / total);

self.addEventListener("message", function (event) {
  const { scalex, scaley, px, py, sh, sw, width, height } = event.data;

  const data = new Uint8ClampedArray(event.data.pixels);

  for (let x = 0; x < sw; x += 1) {
    for (let y = 0; y < sh; y += 1) {
      const index = (x + y * sw) * 4;
      const iteration = calculate(px + x, py + y);
      const c = scale([0, 255], iteration, MAX_ITERATIONS);
      data[index + 0] = c;
      data[index + 1] = 0;
      data[index + 2] = 0;
      data[index + 3] = 255;
    }
  }

  self.postMessage(event.data.pixels, [event.data.pixels]);

  function calculate(px, py) {
    let x0 = scale(scalex, px - width / 2, width);
    let y0 = scale(scaley, py - height / 2, width);
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
  }
});
