var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
// Get your data wrangled
var data = null;
var rdata = {};
var u2w = {};
// Retrieve data function
function loadJSON (callback) {   
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    // Path to your file as served by your webserver
   xobj.open ('GET', 'https://tlmaurer.github.io/soccom-d3-eg/data/SOCCOMtracks.json', true); 
   //   xobj.open ('GET', 'data/SOCCOMtracks.json', true); 
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback (xobj.responseText);
        }
    };
    xobj.send (null);  
}


/*
  All this stuff needs global scope to work.  
  There is definitely a better way to do all this though!
*/
var g = null;
var projection = null;
var pointmap = {};
var pointuw = {};
var allpoints = [];
var e = [];
var searchFloatFunction = function (d, i) {
    var wmoinput = document.getElementById("mySearch").value;
	var wmopoints = [];
	if (wmoinput > 1000000) {
		for (var k = 0; k < pointmap [wmoinput].length; k++) {
			wmopoints.push (allpoints [pointmap [wmoinput][k]]);
		}
	} else {
		for (var k = 0; k < pointuw [wmoinput].length; k++) {
			wmopoints.push (allpoints [pointuw [wmoinput][k]]);
		}
	}		
	
    g.selectAll ("circle")
        .data (wmopoints)
        .attr ("cx",  function (e) {
            return projection ([
                e.lon, e.lat
            ]) [0] ;
        })
        .attr ("cy",  function (e) {
            return projection ([
                e.lon, e.lat
            ]) [1] ;
        })
        .attr ("fill", function (e, i) {
            if (e.idx == e.len-1) {
                return "orange";
            } else {
                return "purple";
            }
        })
        .attr ("r", function (e, i) {
            if (e.idx == e.len-1) {
                return "8px";
            } else {
                return "2px";
            }
        })
        .attr ("opacity", 0.5);

    return;
}


// Actually try to load the data
loadJSON (function (response) {
    // Process the file into a valid JSON object
    data = JSON.parse (response);
    // Reprocess the data into a more friendly and useful format
    var cnt = 0;
    var colors = ["lightgray", "lightgreen", "lightskyblue",
                  "lightcyan", "lightcoral", "lightsteelblue"];
    var idx = 0;
    data.forEach (function (d) {
        for (var i = 0; i < d.LATS.length; i++) {
            if (d.LATS [i] && d.LONS [i]) {
                allpoints.push ({
                    lat: d.LATS [i][0],
                    lon: d.LONS [i][0] >= 180 ? d.LONS [i][0] - 360 : d.LONS [i][0],
                    date: d.DATES [i],
                    wmo: d.WMO,
                    uwid: d.UWID,
                    idx: i,
                    len: d.LATS.length,
                    cnt: cnt % 6
                });
                if (i == 0) {
                    pointmap [d.WMO] = [idx];
					pointuw [d.UWID] = [idx];
                } else {
                    pointmap [d.WMO].push (idx);
					pointuw [d.UWID].push (idx);
                }
                idx += 1;
            }
        }
        cnt += 1;
    });
    
    // Draw some sort of map
    var width = 960, height = 960;
    projection = d3.geo.stereographic()
        .scale(700)
        .rotate ([0,90])
        .translate([width/2, height/2])
	.clipAngle(180 - 1e-4)
	.clipExtent([[0, 0], [width, height]])
        .precision (0.1);

    var drag = d3.behavior.drag()
	.on("drag", function(d,i) {
            d.x += d3.event.dx
            d.y += d3.event.dy
            d3.select(this).attr("transform", function(d,i){
                return "translate(" + [ d.x,d.y ] + ")"
            })
        });
    
    var zoom = d3.behavior.zoom()
	.translate([width / 2, height / 2])
	.scale(700)
	.scaleExtent([50, 3000])
	.on("zoom", zoomed);
    
    var graticule = d3.geo.graticule();
    
    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);
    var path = d3.geo.path()
        .projection(projection);
    g = svg.append("g");
    
    svg
	.call(drag)
	.call(zoom)
	.call(zoom.event);
    
    
    g.append("path")
	.datum(graticule)
	.attr("class", "graticule")
	.attr("d", path);

    var dateformat = d3.time.format("%m/%d/%Y");
    var today = new Date();
    var current = d3.time.day.offset(today, -30);
    
    function zoomed() {
	projection
	    .translate(zoom.translate())
	    .scale(zoom.scale())
	
	g.selectAll("path")
	    .attr("d", path);
	
	g.append("path")
	    .datum(graticule)
	    .attr("class", "graticule")
	    .attr("d", path);
	
	g.selectAll("circle")
	    .attr("transform", function (d) {
		return "translate(" + projection([d.Lon, d.Lat]) + ")";
	    })
	
	    .attr ("cx", function (d) {
                return projection ([
                    d.lon, d.lat
                ]) [0] ;
            })
	    .attr ("cy",
                   function (d) {
                       return projection ([
                           d.lon,
                           d.lat
                       ]) [1] ;
                   })
	    .attr ("r", function (d, i) {
                if (d.idx == d.len-1) {
                    return "4px";
                } else {
                    return "1px";
                }
            })
	    .attr ("fill",
                   function (d, i) {
                       if (d.idx == d.len-1) {
                           if (Date.parse(today)-Date.parse(d.date) < 2592000000 ) { // 30 days.  there must be a smarter way to do this :-)
                               return "seagreen";
                           } else {
                               return "red";
                           }
                       } else {
                           //return colors [d.cnt];
			   return "darkgray";
                       }
                   })
            .attr ("opacity", function (d, i) {
                if (d.idx == d.len-1) {
                    return .8;
                } else {
                    return .5;
                }
            })
            .on ("mouseover", function (d, i) {
                if (d.idx == d.len-1) {
                    div.transition ()
                        .duration (100)
                        .style ("opacity", .9);
                    div.html (
                        "<strong>WMO</strong>: " + d.wmo  
                            + "<br/><strong>UWID</strong>: " + d.uwid
							+ "<br/><strong>last lat</strong>: " + d.lat
							+ "<br/><strong>last lon</strong>: " + d.lon
							+ "<br/><strong>last date:" + d.date
							+ "<br/><strong>Download QC data:" + '<a target="_blank" href= "https://www3.mbari.org/lobo/Data/FloatVizData/qc/' + d.uwid + 'SOOCNQC.txt">ODVtext' + 
                            "</a>"  +
                            ', <a target="_blank" href= "ftp://ftp.ifremer.fr/ifremer/argo/dac/aoml/' + d.wmo + '/' + d.wmo + '_Mprof.nc">ARGOnetcdf' + 
                            "</a>"
                    )
                        .style (
                            "text-align", "left"
                        )
                        .style (
                            "left",
                            (projection ([d.lon,d.lat])[0]+10) + "px"
                        )
                        .style (
                            "top",
                            (projection ([d.lon,d.lat])[1]-90) + "px"
                        )
                        .style ("width", "250px").style ("height", "85px");
                    d3.select (this)
                        .attr ("fill", "orange")
                        .attr ("r", "6px")
                        .attr ("opacity", 0.5);
                    var wmopoints = [];
                    for (var k = 1; k < pointmap [d.wmo].length; k++) {
                        wmopoints.push (allpoints [pointmap [d.wmo][k]]);
                    }
                    g.selectAll ("circle")
                        .data (wmopoints)
                        .attr ("cx",  function (e) {
                            return projection ([
                                e.lon, e.lat
                            ]) [0] ;
                        })
                        .attr ("cy",  function (e) {
                            return projection ([
                                e.lon, e.lat
                            ]) [1] ;
                        })
                        .attr ("fill", "purple")
                        .attr ("r", "2px")
                        .attr ("opacity", 0.5);
                }
            })
            .on ("mouseout", function (d, i) {
                if (d.idx == d.len-1) {
                    div.transition ()
                        .duration (2500)
                        .style ("opacity", 0);
                    
                    if (Date.parse(today)-Date.parse(d.date)<2592000000) {
                        d3.select (this)
                            .attr ("fill", "seagreen")
                            .attr ("r", "4px")
                            .attr ("opacity", .9);
                    } else {
                        d3.select (this)
                            .attr ("fill", "red")
                            .attr ("r", "4px")
                            .attr ("opacity", .9);
                    }
                    var wmopoints = [];
                    for (var k = 1; k < pointmap [d.wmo].length; k++) {
                        wmopoints.push (allpoints [pointmap [d.wmo][k]]);
                    }
                    g.selectAll ("circle")
                        .data (wmopoints)
                        .attr ("cx",  function (e) {
                            return projection ([
                                e.lon, e.lat
                            ]) [0] ;
                        })
                        .attr ("cy",  function (e) {
                            return projection ([
                                e.lon, e.lat
                            ]) [1] ;
                        })
                        .attr ("fill", function (e, j) { return colors [e.cnt]; })
                        .attr ("r", "1px")
                        .attr ("opacity", 0.5);
                }
            });
	//d3.csv("data/dailyseaice.csv", function (data) {
		d3.csv("https://tlmaurer.github.io/soccom-d3-eg/data/dailyseaice.csv", function (data) {			var icecoords = [];
			for (var i = 0, len = data.length - 1; i <= len; i++) {
				icecoords.push([data[i].Lon, data[i].Lat]);
			}

			var icepoly = [];
			icepoly.push({
				type: "LineString",
				coordinates: icecoords,
			});

			var iceArcs = g.selectAll(".ice")
				.data(icepoly)
				.enter().append("path")
				.style("fill", "#A9CCE3")
				.style("opacity", 0.3)
				.style("stroke", "#A9CCE3")
				.style("stroke-width", 2)
				.attr("d", path)
				.text("Median ice extent");
		});
	
    }

    
    // load and display the World
    d3.json("https://tlmaurer.github.io/soccom-d3-eg/data/world-110m2.json", function(error, topology) {
        g.selectAll("path",".graticule")
            .data(topojson.object(topology, topology.objects.countries)
                  .geometries)
            .enter()
            .append("path")
            .attr("d", path);
        // Do something here to load 'rdata' points cleverly
        // into the map.  Extending this last is left to the reader.
        g.selectAll("circle")
	    .data (allpoints)
            .enter ()
	    .append ("circle")
	    .attr ("cx", function (d) {
                return projection ([
                    d.lon, d.lat
                ]) [0] ;
            })
	    .attr ("cy",
                   function (d) {
                       return projection ([
                           d.lon,
                           d.lat
                       ]) [1] ;
                   })
	    .attr ("r", function (d, i) {
                if (d.idx == d.len-1) {
                    return "4px";
                } else {
                    return "1px";
                }
            })
	    .attr ("fill",
                   function (d, i) {
                       if (d.idx == d.len-1) {
                           if (Date.parse(today)-Date.parse(d.date) < 2592000000 ) {
                               return "seagreen";
                           } else {
                               return "red";
                           }
                       } else {
                           return "darkgray";
                       }
                   })
            .attr ("opacity", function (d, i) {
                if (d.idx == d.len-1) {
                    return .8;
                } else {
                    return .5;
                }
            })
            .on ("mouseover", function (d, i) {
                if (d.idx == d.len-1) {
                    div.transition ()
                        .duration (100)
                        .style ("opacity", .9);
                    div.html (
                        "<strong>WMO</strong>: " + d.wmo  
                            + "<br/><strong>UWID</strong>: " + d.uwid
							+ "<br/><strong>last lat</strong>: " + d.lat
							+ "<br/><strong>last lon</strong>: " + d.lon
							+ "<br/><strong>last date:" + d.date
							+ "<br/><strong>Download QC data:" + '<a target="_blank" href= "https://www3.mbari.org/lobo/Data/FloatVizData/qc/' + d.uwid + 'SOOCNQC.txt">ODVtext' + 
                            "</a>"  +
                            ', <a target="_blank" href= "ftp://ftp.ifremer.fr/ifremer/argo/dac/aoml/' + d.wmo + '/' + d.wmo + '_Mprof.nc">ARGOnetcdf' + 
                            "</a>"
                    )
                        .style (
                            "text-align", "left"
                        )
                        .style (
                            "left",
                            (projection ([d.lon,d.lat])[0]+10) + "px"
                        )
                        .style (
                            "top",
                            (projection ([d.lon,d.lat])[1]-90) + "px"
                        )
                        .style ("width", "250px").style ("height", "85px");
                    d3.select (this)
                        .attr ("fill", "orange")
                        .attr ("r", "6px")
                        .attr ("opacity", 0.5);
                    var wmopoints = [];
                    for (var k = 1; k < pointmap [d.wmo].length; k++) {
                        wmopoints.push (allpoints [pointmap [d.wmo][k]]);
                    }
                    g.selectAll ("circle")
                        .data (wmopoints)
                        .attr ("cx",  function (e) {
                            return projection ([
                                e.lon, e.lat
                            ]) [0] ;
                        })
                        .attr ("cy",  function (e) {
                            return projection ([
                                e.lon, e.lat
                            ]) [1] ;
                        })
                        .attr ("fill", "purple")
                        .attr ("r", "2px")
                        .attr ("opacity", 0.5);
                }
            })
            .on ("mouseout", function (d, i) {
                if (d.idx == d.len-1) {
                    div.transition ()
                        .duration (2500)
                        .style ("opacity", 0);
                    
                    if (Date.parse(today)-Date.parse(d.date)<2592000000) {
                        d3.select (this)
                            .attr ("fill", "seagreen")
                            .attr ("r", "4px")
                            .attr ("opacity", .9);
                    } else {
                        d3.select (this)
                            .attr ("fill", "red")
                            .attr ("r", "4px")
                            .attr ("opacity", .9);
                    }
                    var wmopoints = [];
                    for (var k = 1; k < pointmap [d.wmo].length; k++) {
                        wmopoints.push (allpoints [pointmap [d.wmo][k]]);
                    }
                    g.selectAll ("circle")
                        .data (wmopoints)
                        .attr ("cx",  function (e) {
                            return projection ([
                                e.lon, e.lat
                            ]) [0] ;
                        })
                        .attr ("cy",  function (e) {
                            return projection ([
                                e.lon, e.lat
                            ]) [1] ;
                        })
                        .attr ("fill", function (e, j) { return colors [e.cnt]; })
                        .attr ("r", "1px")
                        .attr ("opacity", 0.5);
                }
            });
        
    });
	
	//d3.csv("data/dailyseaice.csv", function (data) {
	d3.csv("https://tlmaurer.github.io/soccom-d3-eg/data/dailyseaice.csv", function (data) {
		var icecoords = [];
		for (var i = 0, len = data.length - 1; i <= len; i++) {
			icecoords.push([data[i].Lon, data[i].Lat]);
		}

		var icepoly = [];
		icepoly.push({
			type: "LineString",
			coordinates: icecoords,
		});

		var iceArcs = g.selectAll(".ice")
			.data(icepoly)
			.enter().append("path")
			.style("fill", "#A9CCE3")
			.style("opacity", 0.3)
			.style("stroke", "#A9CCE3")
			.style("stroke-width", 2)
			.attr("d", path)
			.text("Median ice extent");
	});
});

var ordinal = d3.scale.ordinal()
    .domain(["Active float", "Inactive float", "USNIC daily ice edge"])
    .range(["seagreen", "red", "#A9CCE3"]);

var legsvg = d3.select("#legend").append("svg");

legsvg.append("g")
    .attr("class", "legendfloat")
    .attr("transform", "translate(20,20)");

var legendflt = d3.legend.color()
    .shape("path", d3.svg.symbol().type("circle").size(100)())
    .shapePadding(10)
    .scale(ordinal);

legsvg.select(".legendfloat")
    .call(legendflt);	

