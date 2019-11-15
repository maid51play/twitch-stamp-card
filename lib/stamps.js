const { createCanvas, loadImage } = require('canvas')

const { Random, MersenneTwister19937 } = require('random-js');

const WIDTH = 800;
const HEIGHT = 500;
const ROWS = 3;
const COLUMNS = 5;
const X1 = 60;
const Y1 = 110;
const X2 = 740;
const Y2 = 390;
const CELL_WIDTH = (X2 - X1) / (COLUMNS - 1);
const CELL_HEIGHT = (Y2 - Y1) / (ROWS - 1);
const STAMP_WIDTH = 110;
const STAMP_HEIGHT = 110;
const STAMP_DISTANCE_VARIANCE = 6;
const STAMP_ROTATION_VARIANCE = 10;

let STAMP_DEFAULT;
let STAMP_HALLOWEEN_2020;

const prepare = async () => {
    BACKGROUND = await loadImage('public/images/stampcard.png');
    STAMP_DEFAULT = await loadImage('public/images/stamp.png');
    STAMP_HALLOWEEN_2020 = await loadImage('public/images/halloweenstamp.png');
}

const getStampCoordinates = (n) => {
  const row = Math.floor(n / COLUMNS);
  const column = n % COLUMNS;

  const x = (CELL_WIDTH * column) + X1
  const y = (CELL_HEIGHT * row) + Y1

  return [x, y];
}

const getFuzziness = (seed) => {
  const random = new Random(MersenneTwister19937.seed(seed));

  const gauss = (mu, sigma) => {
    const u1 = random.real(0, 1);
    const u2 = random.real(0, 1);
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(u2 * Math.PI * 2);
    return z0 * sigma + mu;
  }

  const dx = gauss(0, STAMP_DISTANCE_VARIANCE);
  const dy = gauss(0, STAMP_DISTANCE_VARIANCE);
  const degrees = gauss(0, STAMP_ROTATION_VARIANCE);

  return [dx, dy, degrees];
}

const render = (stamps) => {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(BACKGROUND, 0, 0, WIDTH, HEIGHT);
  
  stamps.forEach((stamp, n) => {
    const [sx, sy] = getStampCoordinates(n);
    const [dx, dy, degrees] = getFuzziness(stamp.id);

    let image = STAMP_DEFAULT;

    if (stamp.eventId === 15 || stamp.eventId === 16) {
      image = STAMP_HALLOWEEN_2020;
    }

    ctx.save();
    ctx.translate(sx + dx, sy + dy);
    ctx.rotate(degrees * (Math.PI / 180));
    ctx.drawImage(image, -STAMP_WIDTH / 2, -STAMP_HEIGHT / 2, STAMP_WIDTH, STAMP_HEIGHT);
    ctx.restore();
  });

  return canvas;
}

module.exports = { prepare, render };
