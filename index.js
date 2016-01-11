const Packets = require('beam-interactive-node/dist/robot/packets');
const Driver = require('./driver');
const start = require('./tetris');

const driver = new Driver();
const spacebar = 32;
const Target = Packets.ProgressUpdate.Progress.TargetType;

var _robot;

start(function (err, robot) {
    if (err) throw err;

    _robot = robot;

    driver.on('change', (state) => console.log(state));
    driver.start();

    var data = { x: 0, y: 0, holdingSpace: 0 };
    robot.on('report', function (report) {
        report.joystick.forEach((joy) => {
            data[joy.axis === 0 ? 'x': 'y'] = joy.info.mean
        });

        report.tactile.forEach((tactile) => {
            if (tactile.code === spacebar) {
                data.holdingSpace = Math.max(0, data.holdingSpace -
                    tactile.up.frequency + tactile.down.frequency);
            }
        });

        var threshold = report.quorum / 2;
        var splitProg = {
            target: Target.TACTILE,
            progress: threshold ? Math.min(1, data.holdingSpace / threshold) : 0,
            code: spacebar,
        };
        var progress = [
            { target: Target.JOYSTICK, code: 0, progress: data.x },
            { target: Target.JOYSTICK, code: 1, progress: data.y },
            splitProg
        ];

        driver.moveMouse(data.x, data.y);
        if (data.holdingSpace > threshold) {
            data.holdingSpace = 0;
            splitProg.fired = true;
            driver.split();
        }

        robot.send(new Packets.ProgressUpdate({ progress }));
    });
});
