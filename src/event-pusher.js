let mongoClient = require('mongodb').MongoClient;
let config = require('./config');
let url = "mongodb://" + config.mongo.host + ":27017/pstracker";
let aguid = require('aguid');

class EventPusher {

    constructor() {
        const self = this;

        this.peoples = [];
        this.campaigns = [];
        this.eventKeys = [
            'c', 'e', 'ip', 'ua', 's'
        ];

        mongoClient.connect(url, function (err, client) {
            let campaignsCollection = client.db('pstracker').collection('campaigns');
            campaignsCollection.find({}).toArray(function (err, data) {
                self.campaigns = data;
                client.close();
            });
        });
    }

    clean() {
        this.triggers = [];
        this.sessions = [];
    }

    extractTracking(event) {
        let tracking = {};
        for (let key in event) {
            if (this.eventKeys.indexOf(key) === -1) {
                tracking["tracking." + key] = event[key];
            }
        }
        return tracking;
    }

    push(events) {
        const self = this;
        events.forEach(function (event) {
            const campaign = self.campaigns.find(o => o.name === event.c);

            if (campaign) {
                // Get campaign event
                const campaignEvent = event.e
                    ? campaign.events.find(o => o.name === event.e)
                    : campaign.events.find(o => o.is_default === true);

                // Get campaign source
                const campaignSource = event.s
                    ? campaign.sources.find(o => o.name === event.s)
                    : campaign.sources.find(o => o.is_default === true);

                // Create unique identity for session campaign + ip + 4 days max
                const guid = aguid(campaign.name + '@' + event.ip);

                campaignEvent.revenue = parseFloat(event.r) ? event.r : campaignEvent.revenue || 0.0;
                let session = {
                    time: new Date(),
                    source: campaignSource,
                    ua: event.ua
                };

                mongoClient.connect(url, function (err, client) {
                    let campaignsCollection = client.db('pstracker').collection('peoples');
                    campaignsCollection.updateOne({
                            guid: guid
                        },
                        {
                            $set: Object.assign({
                                guid: guid,
                                last_seen: new Date(),
                            }, self.extractTracking(event)),
                            $push: {
                                events: campaignEvent,
                                sessions: session
                            },
                            $setOnInsert: {
                                first_session: session,
                                source: campaignSource
                            }
                        },
                        {upsert: true})
                });
            }
        })
    }

}

module.exports.eventPusher = new EventPusher();