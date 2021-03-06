let mongoClient = require('mongodb').MongoClient;
let config = require('./config');
let url = "mongodb://" + config.mongo.host + ":27017";
let aguid = require('aguid');

class EventPusher {

    constructor() {
        const self = this;
        this.client = null;
        this.peoples = [];
        this.campaigns = [];
        this.eventKeys = [
            'c', 'e', 'ip', 'ua', 's'
        ];
    }

    extractTracking(event, appendPrefix) {
        let tracking = {};
        for (let key in event) {
            if (this.eventKeys.indexOf(key) === -1) {
                tracking[( appendPrefix  ? "tracking." : "") + key] = event[key];
            }
        }
        return tracking;
    }

    push(events, cb) {
        const self = this;
        let documents = [];

        this.startPushOperation(function () {
            events.forEach(function (event) {
                const campaign = self.campaigns.find(o => o.name === event.c);

                if (campaign) {
                    // Get campaign event
                    let campaignEvent = event.e
                        ? campaign.events.find(o => o.name === event.e)
                        : campaign.events.find(o => o.is_default === true);

                    if ( ! campaignEvent)
                        campaignEvent = campaign.events.find(o => o.is_default === true);

                    // Set revenue
                    campaignEvent.revenue = parseFloat(event.r) ? event.r : campaignEvent.revenue || 0.0;

                    // Get campaign source
                    const campaignSource = event.s
                        ? campaign.sources.find(o => o.name === event.s)
                        : campaign.sources.find(o => o.is_default === true);

                    // Create unique identity for session campaign + ip
                    const guid = event.guid ? event.guid : aguid(campaign.name + '@' + (event.uid || event.ip));

                    let session = {
                        time: new Date(),
                        ip: event.ip,
                        ua: event.ua,
                        tracking: self.extractTracking(event, false)
                    };

                    documents.push({
                        findO: {guid: guid},
                        update: {
                                $set: Object.assign({
                                    guid: guid,
                                    last_seen: new Date(),
                                }, self.extractTracking(event, true)),
                                $push: {
                                    events: campaignEvent,
                                    sessions: session
                                },
                                $setOnInsert: {
                                    first_session: session,
                                    source: campaignSource,
                                    campaign: campaign._id
                                }
                            }
                    });
                }
            });

            this.insertBulkEventsDocuments(documents, function () {
                self.client.close();
                cb();
            });
        });
    }

    startPushOperation(cb) {
        const self = this;
        mongoClient.connect(url, function (err, client) {
            let campaignsCollection = client.db('pstracker').collection('campaigns');
            campaignsCollection.find({}).toArray(function (err, data) {
                self.campaigns = data;
                self.client = client;
                cb.call(self);
            });
        });
    }

    insertBulkEventsDocuments(documents, cb) {
        let start = (new Date()).getTime();

        mongoClient.connect(url, function (err, client) {
            let collections = client.db('pstracker').collection('peoples');
            let bulk = collections.initializeUnorderedBulkOp();

            documents.forEach(function (document) {
                bulk.find(document.findO).upsert().updateOne(document.update);
            });

            bulk.execute(function () {
                let end = (new Date()).getTime();
                console.log('Operation Time: ' + ((end - start) / 1000 + ' seconds'));
                cb()
            })
        });
    }

}

module.exports.eventPusher = new EventPusher();