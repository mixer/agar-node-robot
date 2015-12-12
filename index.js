const Driver = require('./driver');
const start = require('./tetris');

const driver = new Driver();

driver.on('change', (state) => console.log(state));
driver.start();

setInterval(function () {
    const now = Date.now() / 1000;
    driver.moveMouse(Math.sin(now), Math.cos(now));
}, 100);

setInterval(function () {
    driver.split();
}, 10 * 1000);
