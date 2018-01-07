// Include Modules
let cluster = require('cluster');
let redis = require('redis');
let mongoClient = require('mongodb').MongoClient;
let config;
if (process.env.NODE_ENV === 'production') {
    config = require('./config.prod.json');
}
else {
    config = require('./config.dev.json');
}

let url = "mongodb://" + config.mongo.host + ":27017/pstracker";

// Code to run if we're in the master process
if (cluster.isMaster) {
    // Count the machine's CPUs
    let cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (let i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }
// Code to run if we're in a worker process
} else {

    // Start new redis client
    let client;

    setInterval(function () {
        client = redis.createClient('6379', 'redis');
        console.log('Client Started !');
    }, 4000);

    // Include Express
    let express = require('express');

    // Create a new Express application
    let app = express();

    // Set unique redis key for this cluster to prevent duplication in collection
    let redisKey = 'clicks' + cluster.worker.id;

    // Add a basic route – index page
    app.get('/', function (req, res) {
        // Prevent error if redis is down
        if (client) {
            // Convert query params to JSON and push to redis list
            client.lpush(redisKey, JSON.stringify(req.query));
            //res.cookie('pstracker',randomNumber, { maxAge: 900000, httpOnly: true });

            // Send user message and end the request (*Not waiting for redis)
            res.send('Query params logged!, (Cluster #' + cluster.worker.id + ')');
            res.end();
        }
        else {
            res.send('Redis is down, (Cluster #' + cluster.worker.id + ')');
            res.end();
        }
    });

    // Bind to a port
    app.listen(3000);

    // Log application runs per cluster (Should be as cpu core count)
    console.log('Application running #' + cluster.worker.id);

    // Collect clicks from redis and insert them to mongo every 10 seconds
    setInterval(function () {
        // Prevent error if redis is down
        if ( ! client) return;

        try {
            // Connecting to mongo
            mongoClient.connect(url, function (err, client) {
                console.log('Connected to Mongo - ' + err);

                // Collect clicks from redis
                client.lrange(redisKey, 0, -1, function (err, data) {
                    // After clicks collected, remove old keys to prevent duplications
                    client.del(redisKey, function () {
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

                        if (clicks.length) {
                            if (err) throw err;
                            // Select clicks collection
                            let collection = client.db('pstracker').collection('clicks');

                            // Insert click (One by one) TODO.use insertMany
                            collection.insertMany(clicks, function (err, res) {
                                if (err) throw err;
                                // Close connection after insert
                                client.close();
                            });
                        }
                    });
                })
            });
        }
        catch (e) {
            console.log('Interval failed, probably mongo connection issue')
        }
    }, 2000);
}