// Include the cluster module
var cluster = require('cluster');
// Code to run if we're in the master process
if (cluster.isMaster) {
    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < 1; i += 1) {
        cluster.fork();
    }
// Code to run if we're in a worker process
} else {
    var visits = 1;
    // Include Express
    var express = require('express');
    var fs = require('fs');

    // Create a new Express application
    var app = express();

    // Add a basic route – index page
    app.get('/', function (req, res) {
        res.redirect('http://www.walla.co.il');
    });

    // Bind to a port
    app.listen(3001);
    console.log('Application running #' + cluster.worker.id);
}