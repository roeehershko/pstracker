let config;
if (process.env.NODE_ENV === 'production') {
    config = require('./config.prod.json');
    console.log("PROD CONFIG");
}
else {
    config = require('./config.dev.json');
    console.log("DEV CONFIG");
}

module.exports = config;