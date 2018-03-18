var fs = require ("fs");
var data = JSON.parse (fs.readFileSync ('SOCCOMtracks.json', 'utf8'));

var rdata = {};
var u2w = {};
data.forEach (function (d) {
    var points = [];
    for (var i = 0; i < d.LATS.length; i++) {
        if (d.LATS [i] && d.LONS [i]) {
            points.push ({
                latitude: d.LATS [i][0],
                longitude: d.LONS [i][0],
                date: d.DATES [i]
            });
            console.log (d.LONS[i][0] >= 180 ? d.LONS[i][0] - 360 : d.LONS[i][0]);
        }
    }
    rdata [d.WMO] = points;
    u2w [d.UWID] = d.WMO;
});

//console.log (rdata);

