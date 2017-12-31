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
app.listen(3000);
console.log('Application running');