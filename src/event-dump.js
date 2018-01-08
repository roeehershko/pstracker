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
        }, 2000)
    }

    dumpEvents() {
        // Prevent error if redis is down
        if (!redisCollector.getClient()) return;

        // Connecting to mongo
        mongoClient.connect(url, function (err, mongoClient) {
            console.log('Connection Opened');
            // Return on error
            if (err) throw new Error();

            redisCollector.getEvents(function (clicks) {
                if (clicks.length) {
                    if (err) throw err;
                    // Select clicks collection
                    let collection = mongoClient.db('pstracker').collection('events');

                    // Insert click (One by one) TODO.use insertMany
                    collection.insertMany(clicks, function (err) {
                        if (err) throw err;
                        // Close connection after insert
                        mongoClient.close();
                        console.log('Connection Closed');
                    });
                }
                else {
                    mongoClient.close();
                }

                redisCollector.clearEvents();
            });
        });
    }
}

module.exports.eventDump = new EventDump();