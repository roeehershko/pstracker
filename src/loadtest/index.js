let request = require('request');

let dynamic = {
    sources: ['google', 'facebook'],
    events: ['impression', 'install', 'sale']
};

setInterval(function () {
    for (let i = 0; i <= 50; i++) {
        let uid = (new Date()).getTime() + Math.random() * 100;

        request({
            url: 'http://192.168.99.100/postback',
            qs: {
                c: 'test',
                s: Math.random() * 10 > 3 ? 'google' : 'facebook',
                uid: uid
            }
        });

        if (Math.random() * 10 > 7) {
            setTimeout(function () {
                request({
                    url: 'http://192.168.99.100/postback',
                    qs: {
                        c: 'test',
                        e: 'install',
                        s: Math.random() * 10 > 3 ? 'google' : 'facebook',
                        uid: uid
                    }
                });
            }, 3000);
        }
    }
}, 2000);