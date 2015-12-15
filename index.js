const Driver = require('./driver');
const start = require('./tetris');

const driver = new Driver();


start(function (err, robot) {
    if (err) throw err;

    driver.on('change', (state) => console.log(state));
    driver.start();

    var data = { x: 0, y: 0, holdingSpace: 0 };
    robot.on('report', function (report) {
        report.joystick.forEach((joy) => {
            data[joy.axis === 0 ? 'x': 'y'] = joy.info.mean
        });

        report.tactile.forEach((tactile) => {
            if (tactile.code === 32) {
                data.holdingSpace += tactile.up.frequency - tactile.down.frequency;
            }
        });

        driver.moveMouse(data.x, data.y);
        if (data.holdingSpace / report.quorum) {
            data.holdingSpace = 0;
            driver.split();
        }
    });
});
