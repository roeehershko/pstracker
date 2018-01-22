// Include Modules
let cluster = require('cluster');
let redisCollector = require('./redis-collector').redisEventsCollector;
let splitter = require('./splitter/main').splitter;

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

    // Include Express
    let express = require('express');

    // Create a new Express application
    let app = express();

    // Set unique redis key for this cluster to prevent duplication in collection
    redisCollector.setEventKey('clicks');

    // Add a basic route – index page
    app.get('/', function (req, res) {
        // Prevent error if redis is down
        if (redisCollector.isConnected()) {
            // Get query data
            let data = req.query;

            // Add session ip
            data.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            // Add user agent
            data.ua = req.headers['user-agent'];

            // Convert query params to JSON and push to redis list
            redisCollector.pushEvent(data);

            // Getting redirect URL from the splitter
            let lander = splitter.split(data);

            // Send user message and end the request (*Not waiting for redis)
            if (lander && lander.url)
                res.redirect(lander.url);
            else
                res.send('Missing Landers');

            res.end();
        }
        else {
            res.send('Redis is down, (Cluster #' + cluster.worker.id + ')');
            res.end();
        }
    });

    // Add a basic route – index page
    app.get('/postback', function (req, res) {
        // Prevent error if redis is down
        if (redisCollector.isConnected()) {
            // Get query data
            let data = req.query;

            // Add session ip
            data.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            // Add user agent
            data.ua = req.headers['user-agent'];

            // Convert query params to JSON and push to redis list
            redisCollector.pushEvent(data);

            res.send({
                queued: 1,
                status: 'success'
            });

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
}