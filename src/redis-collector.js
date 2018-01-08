let redis = require('redis');

class RedisEventsCollector {

    constructor() {
        this.client = null;
        this.connected = false;
        this.eventKey = false;
        // Attempt to open redis connection
        this.establishRedis();
    }

    establishRedis() {
        const self = this;

        try {
            // Create redis client
            self.client = redis.createClient('6379', 'redis');

            // Catch connection error
            self.client.on("error", function (err) {
                // Schedule anther connection attempt
                setTimeout(function () {
                    self.establishRedis();
                }, 2000)
            });

            self.client.on('connect', function () {
                self.connected = true;
            });
        }
        catch (e) {
            // Schedule anther connection attempt on exception
            setTimeout(function () {
                self.establishRedis();
            }, 2000)
        }
    }

    setEventKey(key) {
        this.eventKey = key;
    }

    pushEvent(data) {
        this.client.lpush(this.eventKey, JSON.stringify(data));
    }

    getClient() {
        return this.client;
    }

    isConnected() {
        return this.connected;
    }

    getEvents(cb) {
        // Collect clicks from redis
        this.client.lrange(this.eventKey, 0, -1, function (err, data) {
            let clicks = [];
            data.forEach(function (click) {
                // Convert redis JSON to JS object
                click = JSON.parse(click);

                // Verify that click is valid object
                if (click && click.c) {
                    // Add click to array
                    clicks.push(click);
                }
            });

            cb(clicks);
        })
    }

    clearEvents() {
        this.client.del(this.eventKey);
    }
}

module.exports.redisEventsCollector = new RedisEventsCollector();