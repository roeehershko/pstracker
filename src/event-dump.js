let redisCollector = require('./redis-collector').redisEventsCollector;
let eventsPusher = require('./event-pusher').eventPusher;
let config = require('./config');
let url = "mongodb://" + config.mongo.host + ":27017/pstracker";

class EventDump {

    constructor() {
    }

    start() {
        console.log('Started!');

        const self = this;
        try {
            self.dumpEvents(function () {
                console.log('Restarting!');
                setTimeout(function () {
                    self.start()
                }, 6000);
            });
        }
        catch (e) {
            console.log('Interval failed, probably mongo connection issue')
        }
    }

    dumpEvents(cb) {
        // Prevent error if redis is down
        if ( ! redisCollector.getClient()) return;

        redisCollector.getEvents(function (clicks) {
            console.log('TOTAL #' + clicks.length + ' Clicks');
            if (clicks.length) {
                eventsPusher.push(clicks, function () {
                    // Remove all events data
                    cb();
                });
            }
            else {
                cb();
            }
        });
    }
}

module.exports.eventDump = new EventDump();