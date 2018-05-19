//Booleans
var popToggle = false;
var expToggle = true;

//Width and height
var w = 800;
var h = 750;

//Define map projection
var projection = d3.geoTransverseMercator()
                   .translate([w/2, - 1130])
                   .rotate([58 + 22 / 60, -34 + 36 / 60]) // 58 deg 22' west, 34 deg 36' south
                   .scale([w*1.5]);

//Define path generator
var path = d3.geoPath()
             .projection(projection);

//Define quantize scale to sort data values into buckets of color
var colorDensity = d3.scaleThreshold()
              .domain([3,5,10,50]) //Chosen input domain for color scale based on data
              .range(["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"]);
              //Colors derived from ColorBrewer, by Cynthia Brewer

var colorExports = d3.scaleThreshold()
              .domain([300,600,1000,10000]) //Chosen input domain for color scale based on data
              .range(["rgb(242,240,247)","rgb(203,201,226)","rgb(158,154,200)","rgb(117,107,177)","rgb(84,39,143)"]);
              //Colors derived from ColorBrewer, by Cynthia Brewer

//Create SVG element
var svg = d3.select("body")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

//Load in agriculture data
d3.csv("data.csv", function(data) {

    //Load in GeoJSON data
    d3.json("level1argentina.json", function(json) {

        //Merge the ag. data and GeoJSON
        //Loop through once for each ag. data value
        for (var i = 0; i < data.length; i++) {
            
            //Grab region name
            var dataRegion = data[i].location;

            //Grab density value, and convert from string to float
            var dataDensity = parseFloat(data[i].density);
            
            //Grab gdp value, and convert from string to float
            var dataExports = parseFloat(data[i].exports);

            //Find the corresponding region inside the GeoJSON
            for (var j = 0; j < json.features.length; j++) {

                var jsonRegion = json.features[j].properties.NAME_1;

                if (dataRegion == jsonRegion) {

                    //Copy the data values into the JSON
                    json.features[j].properties.density = dataDensity;
                    json.features[j].properties.exports = dataExports;

                    //Stop looking through the JSON
                    break;

                }
            }		
        }
        
        drawColors.call();
        
        document.getElementById("popButton").onclick = function (d) {
            popToggle = true;
            expToggle = false;
            svg.selectAll("path").remove();
            drawColors.call();
        }
        
        document.getElementById("expButton").onclick = function (d) {
            popToggle = false;
            expToggle = true;
            svg.selectAll("path").remove();
            drawColors.call();
        }
        
        function drawColors() {
            if (popToggle) {
                //Bind data and create one path per GeoJSON feature
                svg.selectAll("path")
                   .data(json.features)
                   .enter()
                   .append("path")
                   .attr("d", path)
                   .style("fill", function(d) {
                        //Get data value
                        var popDensity = d.properties.density;

                        if (popDensity) {
                            //If value exists…
                            return colorDensity(popDensity);
                        } else {
                            //If value is undefined…
                            return "purple";
                        }
                   });

            } else if (expToggle) {
                //Bind data and create one path per GeoJSON feature
                svg.selectAll("path")
                   .data(json.features)
                   .enter()
                   .append("path")
                   .attr("d", path)
                   .style("fill", function(d) {
                        //Get data value
                        var expValue = d.properties.exports;

                        if (expValue) {
                            //If value exists…
                            return colorExports(expValue);
                        } else {
                            //If value is undefined…
                            return "purple";
                        }
                   });
            }
        }

    });

});

//Population Density Legend
var color = d3.scaleThreshold()
    .domain([3, 5, 10, 50])
    .range(["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"]);

var log = d3.legendColor()
    .labelFormat(d3.format(".1f"))
    .labels(d3.legendHelpers.thresholdLabels)
    .scale(color);

var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(450,550)")
    .call(log);

legend.append("text")
    .attr("class", "caption")
    .attr("x", -5)
    .attr("y", -5)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Population Density per square kilometer 2017");

//Exports Legend
var color = d3.scaleThreshold()
    .domain([300, 600, 1000, 10000])
    .range(["rgb(242,240,247)","rgb(203,201,226)","rgb(158,154,200)","rgb(117,107,177)","rgb(84,39,143)"]);

var log = d3.legendColor()
    .labelFormat(d3.format(".0f"))
    .labels(d3.legendHelpers.thresholdLabels)
    .scale(color);

var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(450,430)")
    .call(log);

legend.append("text")
    .attr("class", "caption")
    .attr("x", -5)
    .attr("y", -5)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Exports in million US $ per square kilometer 2011");

			
			
