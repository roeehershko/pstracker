module.exports.Splitter = class {

    constructor(campaign) {
        this.campaign = campaign;
        this.drivers = [
            new TimeSplitDriver(),
            new GeoSplitDriver(), // Return list of landers and there weight,
            new ParamSplitDriver(),
        ]
    }

    split() {
        this.geoDriver.process(country)
    }
};

class GeoSplitDriver {

    constructor(session, splits) {
        this.splits = splits;
        this.session = session;
    }

    process() {
        let splits = [];
        let sessionCountry = this.session.country;
        this.splits.forEach(function (split) {
            for (let country in split) {
                if (split.hasOwnProperty(country)) {
                    if (country === sessionCountry) {
                        let weight = split[country];
                        splits.push(
                            new Split(weight, split.lander)
                        );
                    }
                }

            }
        });
    }
}