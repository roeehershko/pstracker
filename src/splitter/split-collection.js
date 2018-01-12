module.exports.SplitCollection = class {

    constructor(endPoints) {
        this.endPoints = endPoints;
    }

    getSplit() {
        let endPoint = null;
        let startPoint = 0;
        let splitPoints = [];

        this.endPoints.forEach(function (endPoint) {
            startPoint += endPoint.weight;
            splitPoints.push({
                startPoint: startPoint,
                endPoint: endPoint
            });
        });

        let random = Math.round(Math.random() * (startPoint - 1)) + 1;

        splitPoints.forEach(function (splitPoint) {
            if (splitPoint.startPoint >= random && ! endPoint) {
                endPoint = splitPoint;
            }
        });

        return endPoint.endPoint.hasOwnProperty('lander') ? endPoint.endPoint.lander : null;
    }
};