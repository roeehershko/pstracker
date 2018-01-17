let mongoClient = require('mongodb').MongoClient;
let config = require('../config');
let url = "mongodb://" + config.mongo.host + ":27017";
let SplitCollection = require('./split-collection').SplitCollection;
let aguid = require('aguid');

class Splitter {

    constructor() {
        const self = this;
        this.campaigns = [];

        // Reload campaigns entries
        setInterval(function () {
            self.reload();
        }, 2000);

        // Initially load campaigns
        self.reload();
    }

    reload() {
        const self = this;

        mongoClient.connect(url, function (err, client) {
            let campaignsCollection = client.db('pstracker').collection('campaigns');
            campaignsCollection.find({}).toArray(function (err, data) {
                self.campaigns = data;
                client.close();
            });
        });
    }

    split(event) {
        let campaign = this.campaigns.find(o => o.name === event.c);
        let endpoints = campaign ? campaign.endpoints : null;

        if ( ! campaign || ! endpoints)
            return null;

        let splitCollection = new SplitCollection(endpoints);
        let split = splitCollection.getSplit();

        if ( ! split) return null;

        return this.parseLander(split, campaign, event);
    }

    parseLander(lander, campaign, event) {
        const guid = event.guid ? event.guid : aguid(campaign.name + '@' + (event.uid || event.ip));

        lander.url = lander.url.replace('{auid}', guid);
        return lander;
    }
}

module.exports.splitter = new Splitter();