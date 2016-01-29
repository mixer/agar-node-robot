const Bluebird = require('bluebird');
const Packets = require('beam-interactive-node/dist/robot/packets');
const Tetris = require('beam-interactive-node');

const rp = require('request-promise');
const config = require('./config/config');

module.exports = function (callback) {
    var channel, user;
    rp({
        url: config.path + '/users/login',
        method: 'POST',
        auth: config.httpAuth,
        form: {
            username: config.beam.username,
            password: config.beam.password
        },
        jar: true,
        json: true
    }).then(function (data) {
        channel = data.channel;
        user = data;
        return rp({
            url: config.path + '/tetris/' + channel.id + '/robot',
            auth: config.httpAuth,
            jar: true,
            json: true
        });
    }).then(function (data) {
        data.remote = data.address;
        data.channel = channel.id;
        data.reportInterval = 20;
        
        const robot = new Tetris.Robot(data);
        robot.handshake(function (err) {
            callback(err, robot);
        });
    }).catch(callback);
};
