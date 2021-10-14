/* Claire Watts*/

/* --------------------------------------------------------------------
Sets up margins by specifying the amount of space for the top, right,
bottom, and left margins. Calculates the width and height by
subtracting the set margins to create the desired inner dimensions.
----------------------------------------------------------------------*/
var margin = {top: 10, right: 100, bottom: 50, left: 100},
    width = 760 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

/* --------------------------------------------------------------------
Creates an SVG element, which are scalable vector graphics. Appending 
"g" signifies a group SVG elements together. Sets up the location and
size of the SVG based on width & height including margins. Translates
the origin of the SVG to the top left corner of the SVG.
----------------------------------------------------------------------*/
var svg = d3.select("body")
    .append("svg")
    .attr("class", "chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var parseTime = d3.timeParse("%Y");

/* --------------------------------------------------------------------
Defines X and Y scales so that data can be displayed proportionately.
Also sets the color scale.
----------------------------------------------------------------------*/ 
var xScale = d3.scaleTime().rangeRound([0, width]);
var yScale = d3.scaleLinear().rangeRound([height, 0]);

var color = d3.scaleOrdinal(d3.schemeCategory10);

/* --------------------------------------------------------------------
Defines X and Y axis based on the proper scales.
----------------------------------------------------------------------*/ 
var xAxis = d3.axisBottom(xScale);
var yAxis = d3.axisLeft(yScale);

/* --------------------------------------------------------------------
Defines the x and y values of the lines.
----------------------------------------------------------------------*/ 
var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return xScale(parseTime(d.year)); })
    .y(function(d) { return yScale(+d.consumption); });

/* --------------------------------------------------------------------
Defines the x and y gridline functions.
----------------------------------------------------------------------*/ 
function Xgridlines() {		
    return xAxis.ticks(5)
}
function Ygridlines() {		
    return yAxis.ticks(5)
}

/* --------------------------------------------------------------------
Imports the data and creates the multiline chart.
----------------------------------------------------------------------*/
d3.csv("BRICSdata.csv",function(error, data){
    
    /* --------------------------------------------------------------------
    Maps year & consumption values to each country.
    ----------------------------------------------------------------------*/
    var countries = data.columns.slice(1).map(function(id) {
        return {
            id: id,
            values: data.map(function(d) {
                return {year: d.year, consumption: d[id]};
            })
        };
    });
    
    console.log(countries);

    /* --------------------------------------------------------------------
    Sets the domains for the X, Y, and color scales.
    ----------------------------------------------------------------------*/
    xScale.domain(d3.extent(data, function(d) { return parseTime(d.year); })); 
    yScale.domain([
        d3.min(countries, function(c) { return d3.min(c.values, function(d) { return +d.consumption; }); }),
        d3.max(countries, function(c) { return d3.max(c.values, function(d) { return +d.consumption; }); })
    ]);
    color.domain(countries.map(function(c) { return c.id; }));
    
    /* --------------------------------------------------------------------
    Draws the x axis, positions the label, and removes domain line.
    ----------------------------------------------------------------------*/
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .text("Year")
        .attr("dx", "52em")
        .attr("dy", "1em")
        .attr("text-anchor", "end")
        .attr("fill", "black")
        .attr("font-size", "10px");
    
    svg.select(".domain").remove()
      
    /* --------------------------------------------------------------------
    Draws the y axis by calling it and positions the label.
    ----------------------------------------------------------------------*/
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .text("Million BTUs Per Person")
        .attr("dx", "-12em")
        .attr("dy", "-4em")
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "end")
        .attr("fill", "black")
        .attr("font-size", "10px");
    
    /* --------------------------------------------------------------------
    Adds the x and y gridlines.
    ----------------------------------------------------------------------*/
    svg.append("g")			
      .attr("class", "grid")
      .attr("transform", "translate(0," + height + ")")
      .call(Xgridlines()
          .tickSize(-height)
          .tickFormat("")
      )
    svg.append("g")			
      .attr("class", "grid")
      .call(Ygridlines()
          .tickSize(-width)
          .tickFormat("")
      )

    /* --------------------------------------------------------------------
    Draws lines to represent the imported data & generates the paths.
    ----------------------------------------------------------------------*/ 
    var country = svg.selectAll(".country")
        .data(countries)
        .enter()
        .append("g")
        .attr("class", "country")
        .append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.values); })
        .style("stroke", function(d) { return color(d.id); })
        .attr("stroke-width", "2")
        .attr("fill", "none");
  
    /* --------------------------------------------------------------------
    Animates the path transition.
    ----------------------------------------------------------------------*/ 
    var totalLength = country.node().getTotalLength();

    country.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    
    /* --------------------------------------------------------------------
    Draws the path labels.
    ----------------------------------------------------------------------*/
    var labels = svg.selectAll(".country")
        .append("text")
        .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
        .attr("class", "label")
        .attr("transform", function(d) { return "translate(" + xScale(parseTime(d.value.year)) + "," + yScale(+d.value.consumption) + ")"; })
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .style("color", "black")
        .text(function(d) { return d.id; });
    
});
