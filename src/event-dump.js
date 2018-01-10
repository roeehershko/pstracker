let mongoClient = require('mongodb').MongoClient;
let redisCollector = require('./redis-collector').redisEventsCollector;
let config = require('./config');
let url = "mongodb://" + config.mongo.host + ":27017/pstracker";

class EventDump {

    constructor() {
    }

    start() {
        const self = this;
        setTimeout(function () {
            try {
                self.dumpEvents(function () {
                    setTimeout(function () {
                        self.start.call(self);
                    }, 2000);
                });
            }
            catch (e) {
                console.log('Interval failed, probably mongo connection issue')
            }
        }, 6000)
    }

    getClient(cb) {
        const self = this;
        mongoClient.connect(url, function (err, client) {
            if (err) console.log('ERR:' + err);
            let collection = client.db('pstracker').collection('peoples');
            cb.call(self, collection);
        });
    }

    dumpEvents(cb) {
        const self = this;
        // Prevent error if redis is down
        if ( ! redisCollector.getClient()) return;

        redisCollector.getEvents(function (clicks) {
            if ( ! clicks.length) return cb();

            self.getClient(function (collection) {
                collection.insertMany(clicks, function () {
                    cb();
                });
            });

            // Remove all events data
            redisCollector.clearEvents();
        });
    }
}

module.exports.eventDump = new EventDump();