const EventEmitter = require('events').EventEmitter;
const Bluebird = require('bluebird');
const webdriver = require('webdriverio');

const states = Object.freeze({ idle: 0, opening: 1, playing: 2 });

var lastRestart = Date.now();
const RESTART_TIMEOUT = 1000 * 60 * 60 * 2; // 2 hours

function whenState(states, method) {
    if (!Array.isArray(states)) states = [states];

    return function () {
        if (states.indexOf(this.state) !== -1) {
            return method.apply(this, arguments);
        }
    };
}

function AgarDriver() {
    EventEmitter.call(this);
    this.state = states.idle;
}
AgarDriver.prototype = Object.create(EventEmitter.prototype);

AgarDriver.prototype.start = function () {
    this.state = states.opening;
    this.client = webdriver.remote({
        desiredCapabilities: {
            browserName: process.env.B_BROWSER || 'firefox',
            chromeOptions: {
                args : [
                    '--disable-plugins',
                    '--disable-internal-flash',
                    '--disable-bundled-ppapi-flash'
                ].concat((process.env.B_ADD_CHROME_ARGS || '').split(','))
            }
        },
    });

    // setInterval(() => {}, 1000);

    this.client.init()
        .windowHandleSize({width:process.env.B_WIDTH,height:process.env.B_HEIGHT})
        .url('http://agar.io')
        .then(() => this._login());

    return this;
};

AgarDriver.prototype.setState = function (state) {
    if (state === this.state) return;

    this.state = state;
    emit('changed', state);
    emit(state);
};

AgarDriver.prototype._login = function () {
    const playButton = '.btn-play-guest';
    const continueButton = '#statsContinue';
    const timeout = 1000 * 10000;

    this.client
        .waitForVisible(playButton, timeout)
        .pause(500)
        .setValue('#nick', process.env.B_NICK || 'beam.pro')
        .pause(500)
        .then(() => {
            this.state = states.playing;
            return this.client.click(playButton);
        })
        .waitForVisible(continueButton, timeout)
        .then(() => { this.state = states.opening })
        .pause(5000)
        .then(() => {
            if (Date.now() - lastRestart >= RESTART_TIMEOUT) {
                lastRestart = Date.now();
                return this.client
                        .refresh()
                        .then(() => this._login());
            }
            this.client.click(continueButton);
            return this._login();
        }).catch((err) => console.log(err));
};

AgarDriver.prototype.moveMouse = whenState(states.playing, function (x, y) {
    return this.client.getViewportSize().then((size) => {
        const multiplier = Math.min(size.width, size.height) / 2;
        var mouseX = (size.width / 2) + x * multiplier;
        var mouseY = (size.height / 2) + y * multiplier;

        return this.client.moveToObject('body', mouseX, mouseY);
    });
});

AgarDriver.prototype.split = whenState(states.playing, function () {
    console.log('splitting');
    return this.client.keys('Space').pause(100);
});

module.exports = AgarDriver;
