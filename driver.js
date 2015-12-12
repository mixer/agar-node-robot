const EventEmitter = require('events').EventEmitter;
const Bluebird = require('bluebird');
const webdriver = require('webdriverio');

const states = Object.freeze({ idle: 0, opening: 1, playing: 2 });


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
            browserName: 'firefox',
        },
    });

    // setInterval(() => {}, 1000);

    this.client.init()
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

    return this.client
        .pause(1000)
        .waitForVisible(playButton, timeout)
        .then(() => {
            this.state = states.playing;
            this.client.click('.btn-play-guest')
        })
        .waitForVisible(continueButton, timeout)
        .pause(5000)
        .then(() => {
            this.state = states.opening;
            console.log('restarting');
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
