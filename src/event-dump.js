let mongoClient = require('mongodb').MongoClient;
let redisCollector = require('./redis-collector').redisEventsCollector;
let eventsPusher = require('./event-pusher').eventPusher;
let config = require('./config');
let url = "mongodb://" + config.mongo.host + ":27017/pstracker";

class EventDump {

    constructor() {
    }

    start() {
        const self = this;
        setInterval(function () {
            try {
                self.dumpEvents();
            }
            catch (e) {
                console.log('Interval failed, probably mongo connection issue')
            }
        }, 6000)
    }

    dumpEvents() {
        // Prevent error if redis is down
        if ( ! redisCollector.getClient()) return;

        redisCollector.getEvents(function (clicks) {
            if (clicks.length) {

                eventsPusher.push(clicks);

                // // Connecting to mongo
                // mongoClient.connect(url, function (err, mongoClient) {
                //     // Select clicks collection
                //     let collection = mongoClient.db('pstracker').collection('triggers');
                //
                //     // Return on error
                //     if (err) throw new Error();
                //
                //     try {
                //         // Insert click (One by one)
                //         collection.insertMany(clicks, function (err) {
                //             if (err) throw err;
                //
                //             // Close connection after insert
                //             mongoClient.close();
                //         });
                //     }
                //     catch(e) {
                //         // Close connection after insert
                //         mongoClient.close();
                //     }
                // });

                // Remove all events data
                redisCollector.clearEvents();
            }
        });
    }
}

module.exports.eventDump = new EventDump();