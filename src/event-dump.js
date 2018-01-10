let mongoClient = require('mongodb').MongoClient;
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
        setTimeout(function () {
            try {
                self.dumpEvents(function () {
                    console.log('Restarting!');
                    setTimeout(function () {
                        self.start()
                    }, 2000);
                });
            }
            catch (e) {
                console.log('Interval failed, probably mongo connection issue')
            }
        }, 2000)
    }

    dumpEvents(cb) {
        console.log('Dump Start!');
        const self = this;
        // Prevent error if redis is down
        if ( ! redisCollector.getClient()) return;

        redisCollector.getEvents(function (clicks) {
            console.log('Dumping!!');
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