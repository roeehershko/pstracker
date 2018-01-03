// Include Modules
let cluster = require('cluster');
let redis = require('redis');
let mongoClient = require('mongodb').MongoClient;
let url = "mongodb://pstracker-mongo:27017/pstracker";

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
    let client = redis.createClient('6379', 'redis');

    // Include Express
    let express = require('express');

    // Create a new Express application
    let app = express();

    // Set unique redis key for this cluster to prevent duplication in collection
    let redisKey = 'clicks' + cluster.worker.id;

    // Add a basic route – index page
    app.get('/', function (req, res) {
        // Convert query params to JSON and push to redis list
        client.lpush(redisKey, JSON.stringify(req.query));

        //res.cookie('pstracker',randomNumber, { maxAge: 900000, httpOnly: true });

        // Send user message and end the request (*Not waiting for redis)
        res.send('Query params logged!, (Cluster #' + cluster.worker.id + ')');
        res.end();
    });

    // Bind to a port
    app.listen(3000);

    // Log application runs per cluster (Should be as cpu core count)
    console.log('Application running #' + cluster.worker.id);

    // Collect clicks from redis and insert them to mongo every 10 seconds
    setInterval(function () {
        // Collect clicks from redis
        client.lrange(redisKey, 0, -1, function (err, data) {
            // After clicks collected, remove old keys to prevent duplications
            client.del(redisKey, function () {
                data.forEach(function (click) {
                    // Convert redis JSON to JS object
                    click = JSON.parse(click);

                    // Verify that click is valid object
                    if (click) {
                        // Connecting to mongo
                        mongoClient.connect(url, function (err, client) {
                            if (err) throw err;
                            // Select clicks collection
                            let collection = client.db('pstracker').collection('clicks');

                            // Insert click (One by one) TODO.use insertMany
                            collection.insertOne(click, function (err, res) {
                                if (err) throw err;
                                // Close connection after insert
                                client.close();
                            });
                        });
                    }
                });
            });
        })
    }, 2000);
}

// docker container exec -it nginxtest bash
// docker run --name pstracker-mongo -d -p 27017:27017 mongo
// docker run -d --name pstracker -p 3000:3000 --link redis:redis --link pstracker-mongo:pstracker-mongo pstracker
// docker run -d --name pstracker-nginx -p 80:80 --link pstracker:pstracker pstracker-nginx