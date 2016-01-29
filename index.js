'use strict';

const SPLIT_TIMEOUT = 10 * 1000;

const Packets = require('beam-interactive-node/dist/robot/packets');
const Driver = require('./driver');
const start = require('./tetris');

const driver = new Driver();
const spacebar = 32;

var _robot;

const SQRT_TWO = Math.sqrt(2);

var splitLocked = false;

start(function (err, robot) {
    if (err) throw err;

    _robot = robot;

    driver.on('change', (state) => console.log(state));
    driver.start();

    let data = { x: 0, y: 0, holdingSpace: 0 };
    robot.on('report', function (report) {

        let joy = report.joystick[0];
        if (joy) {
            data.x = joy.coordMean.X;
            data.y = joy.coordMean.Y;
        }

        let tactile = report.tactile[0];
        if (tactile) {
            data.holdingSpace = tactile.holding;
        }

        let threshold = report.users.quorum / 2;

        let splitFired = false;

        driver.moveMouse(data.x, data.y);
        if (data.holdingSpace > threshold && !splitLocked) {
            splitFired = true;
            splitLocked = true;
            setTimeout(function () {
                splitLocked = false;
            }, SPLIT_TIMEOUT);
            driver.split();
        }

        let joystickProgress = [];
        joystickProgress.push(new Packets.ProgressUpdate.JoystickUpdate({
            id: 0,
            angle: Math.atan2(data.y, data.x),
            intensity: Math.sqrt(data.x * data.x + data.y * data.y) / SQRT_TWO
        }));

        let tactileProgress = [];
        if (splitFired || !splitLocked) {
            tactileProgress.push(new Packets.ProgressUpdate.TactileUpdate({
                id: 1,
                cooldown: splitFired ? SPLIT_TIMEOUT : 0,
                fired: splitFired,
                progress: (threshold > 0) ? (data.holdingSpace / threshold) : 0
            }));
        }

        robot.send(new Packets.ProgressUpdate({
            joystick: joystickProgress,
            tactile: tactileProgress
        }));
    });
});
