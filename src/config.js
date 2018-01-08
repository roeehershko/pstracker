let config;
if (process.env.NODE_ENV === 'production') {
    config = require('./config.prod.json');
}
else {
    config = require('./config.dev.json');
}

module.exports = config;