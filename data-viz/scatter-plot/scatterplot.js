/* Claire Watts, cdwatts@ucsc.edu */

//Define Margin
var margin = {left: 80, right: 80, top: 50, bottom: 50 }, 
    width = 960 - margin.left -margin.right,
    height = 500 - margin.top - margin.bottom;

//Define Color
var colors = d3.scaleOrdinal(d3.schemeCategory20);

//Define SVG
  var svg = d3.select("body")
    .append("svg")
    .attr("class", "plot")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//Define Scales   
var xScale = d3.scaleLinear().range([0, width]);
var yScale = d3.scaleLinear().range([height, 0]);

//Define Tooltip here by appending a div 
var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden");

//Define Axis
var xAxis = d3.axisBottom(xScale).tickPadding(2);
var yAxis = d3.axisLeft(yScale).tickPadding(2).ticks(7);
    
//Get Data
d3.csv("scatterdata.csv",function(error, data){
    data.forEach(function(d) {
        d.name = d.country;
        d.country = d.country;
        d.gdp = +d.gdp;
        d.epc = +d.ecc;
        d.total = +d.ec;
    });
    
    console.log(data);
    
    //Define domain for xScale and yScale
    xScale.domain([0,d3.max(data, function(d) {return d.gdp; })]);
    yScale.domain([0,d3.max(data, function(d) {return d.epc; })]);
   
    //Draw Scatterplot
    var scatter = svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", function(d) { return Math.sqrt(d.total)/.2; })
        .attr("cx", function(d) {return xScale(d.gdp);})
        .attr("cy", function(d) {return yScale(d.epc);})
        .style("fill", function (d) { return colors(d.country); })
        .on("mouseover", function(d) {
            var html  = d.name + "<br/>"
                + "Population: " + d.population + " million" + "<br/>"
                + "GDP: $" + d.gdp + " trillion" + "<br/>"
                + "EPC: " + d.epc + " million BTUs" + "<br/>"
                + "Total: " + d.total + " trillion BTUs ";
            
            return tooltip.html(html);
        })
        .on("mousemove", function(d) {
            return tooltip.style("left", (d3.event.pageX + 15) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .style("visibility", "visible");
        })
        .on("mouseout", function() {
            return tooltip.style("visibility", "hidden");
        });
    
    
    //Draw Country Names
    var names = svg.selectAll(".text")
        .data(data)
        .enter().append("text")
        .attr("class","text")
        .style("text-anchor", "start")
        .attr("x", function(d) {return xScale(d.gdp);})
        .attr("y", function(d) {return yScale(d.epc);})
        .style("fill", "black")
        .text(function (d) {return d.name; });

    //X-axis
    var gX = svg.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width/2)
        .attr("y", 50)
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "black")
        .text("GDP in Trillions of US Dollars (2010)");

    //Y-axis
    var gY = svg.append("g")
        .attr("class", "yaxis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("x", -50)
        .attr("y", -50)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .attr("font-size", "12px")
        .attr("fill", "black")
        .text("Energy Consumption per Capita (in Million BTUs per person)");
    
    // Adds Pan & Zoom functionality using d3.event.transform
    var zoom = d3.zoom()
        .on("zoom", zoomed);

    //Enables zooming when hovering over the circles
    svg.selectAll("circle").call(zoom);
    
    function zoomed() {
        svg.select(".x.axis").call(xAxis.scale(d3.event.transform.rescaleX(xScale)));
        svg.select(".y.axis").call(yAxis.scale(d3.event.transform.rescaleY(yScale)));
        
        scatter.attr("transform", d3.event.transform);
        names.attr("transform", d3.event.transform);  
    }
    

    //Draw legend colored rectangles
    svg.append("rect")
        .attr("x", width-250)
        .attr("y", height-190)
        .attr("width", 220)
        .attr("height", 180)
        .attr("fill", "lightgrey")
        .style("stroke-size", "1px");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", width-100)
        .attr("cy", height-175)
        .style("fill", "white");
    
    svg.append("circle")
        .attr("r", 15.8)
        .attr("cx", width-100)
        .attr("cy", height-150)
        .style("fill", "white");

    svg.append("circle")
        .attr("r", 50)
        .attr("cx", width-100)
        .attr("cy", height-80)
        .style("fill", "white");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width -150)
        .attr("y", height-172)
        .style("text-anchor", "end")
        .text(" 1 Trillion BTUs");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width -150)
        .attr("y", height-147)
        .style("text-anchor", "end")
        .text(" 10 Trillion BTUs");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width -150)
        .attr("y", height-77)
        .style("text-anchor", "end")
        .text(" 100 Trillion BTUs");
    
     svg.append("text")
        .attr("class", "label")
        .attr("x", width -150)
        .attr("y", height-15)
        .style("text-anchor", "middle")
        .style("fill", "Green") 
        .attr("font-size", "16px")
        .text("Total Energy Consumption");     

});
