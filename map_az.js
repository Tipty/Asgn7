//Define Margin
var margin = {left: 40, right: 40, top: 20, bottom: 20 }, 
    width = 1900 - margin.left -margin.right,
    height = 550 - margin.top - margin.bottom;

//Define initial Color with scaling
var color = d3.scaleThreshold()
    .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
    .range(d3.schemeOrRd[9]);

//Define SVG
var svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//Define Tooltip here
var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

//Load multiple files
d3.queue()
  .defer(d3.json, "topo_az.json") 
  .defer(d3.csv, "pop_az.csv")
  .await(ready)

//Project world map on Arizona with proper scaling at the center of svg
var proj = d3.geoMercator()
  .center([-110, 34])
  .translate([width/2, height/2])
  .scale(3000)

var path = d3.geoPath()
  .projection(proj)

//Legend
//Margins of legend
var x = d3.scaleSqrt()
    .domain([0, 4500])
    .rangeRound([440, 950]);

//Grouping and translation
var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(650,20)");

//Draw legend bars
g.selectAll("rect")
    .data(color.range().map(function(d) {
    d = color.invertExtent(d);
    if (d[0] == null) d[0] = x.domain()[0];
    if (d[1] == null) d[1] = x.domain()[1];
    return d;
    }))
    .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

//Draw text of bars
g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Population per square mile");

//Label bars
g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickValues(color.domain()))
    .select(".domain")
    .remove();

//Import files in order
function ready(error, data, pop){
    console.log(data)
    console.log(pop)
  
    //Parse topo_az.json data
    var counties = topojson.feature(data, data.objects.counties).features
    //Parse pop_az.csv
    var population = {}
    pop.forEach(function(d){
    population[d.geo_id2] = [d.rate, d.name, d.FIPSC, d.geo_id1];
    });
    
    console.log(counties)
    console.log(population)

    //Overlap counties with stateborder
    var st = svg.append("path")
        .datum(topojson.mesh(data, data.objects.counties, function(a, b) { return a == b; }))
        .style("fill", "transparent")
        .style("stroke", "black")
        .attr("class", "states")
        .attr("d", path);
    
    //Draw counties
    var count = svg.append("g")
        .selectAll(".county")
        .data(counties)
        .enter().append("path")
        .attr("class", "county")
        .attr("fill", function(d) {
            d.rate = population[d.properties.GEO_ID][0];
            return color(d.rate);
        })
        .attr("d", path)
        //Add .on("mouseover", .....
        .on("mouseover", function(d) {
            //Add Tooltip.html with transition and style
            tooltip.html("<table>" +
            '<tr><th colspan="5">' +
            population[d.properties.GEO_ID][1] +
            "</th></tr>" +
            "<tr><td>Geo ID1</td>" +
            "<td> : </td>" +
            '<td class="right-align">' +
            population[d.properties.GEO_ID][3] +
            "</td></tr>" +
            "<tr><td>Geo ID2</td>" +
            "<td> : </td>" +
            '<td class="right-align">' +
            d.properties.GEO_ID +
            "</td></tr>" +
            "<tr><td>FIPS</td>" +
            "<td> : </td>" +
            '<td class="right-align">' +
            population[d.properties.GEO_ID][2] +
            " </td></tr>" +
            "<tr><td>Density</td>" +
            "<td> : </td>" +
            '<td class="right-align">' + // define in css
            population[d.properties.GEO_ID][0] +
            " sq mi</td></tr>" +   
            "</table>") 
            .style("left", (d3.event.pageX + 40) + "px")
            .style("top", (d3.event.pageY - 50) + "px")
            .transition()
            .duration(100)
            .style("opacity", 1);
        })
        //Then Add .on("mouseout", ....  
        .on("mouseout", function() {
            tooltip.transition()
            .duration(200)
            .style("opacity", 0);
        });
    
      var toggle1 = 0;
      //Button to toggle country borders
      var buttont = svg.append("text")
          .attr("x", width/2 + 200)             
          .attr("y", height/2 - 120)  
          .attr("class", "legend")        
          .text("Toggle County Boundary")
          .on("click", function(d){
             //Check if county borders are present
             //Delete them if so
             if (toggle1 == 0) {
               count.style('stroke-opacity','0')
               toggle1 = 1;
             }
             //Else, put them back
             else {
               count.style('stroke-opacity', '1')
               toggle1 = 0;
             }
          });

      var toggle2 = 0;
      //Button to swap color palletes
      var button = svg.append("text")
          .attr("x", width/2 + 200)             
          .attr("y", height/2 - 150)  //650,20
          .attr("class", "legend")        
          .text("Swap Color")
          .on("click", function(d){

             if (toggle2 == 0) {
               color.range(d3.schemeBuPu[9]);
               update()
               toggle2 = 1;    
             }

             else {
               color.range(d3.schemeOrRd[9]);
               update()
               toggle2 = 0;
             }
          });

        //Update color
        function update(){
            //Color Swap counties
            count.attr("fill", function(d) {
            d.rate = population[d.properties.GEO_ID][0];
                 return color(d.rate);
            })  
            //Remove old legend bar and replace
            g.selectAll("rect").remove()
            g.selectAll("rect")
              .data(color.range().map(function(d) {
                  d = color.invertExtent(d);
                  if (d[0] == null) d[0] = x.domain()[0];
                  if (d[1] == null) d[1] = x.domain()[1];
                  return d;
                }))
              .enter().append("rect")
                .attr("height", 8)
                .attr("x", function(d) { return x(d[0]); })
                .attr("width", function(d) { return x(d[1]) - x(d[0]); })
                .attr("fill", function(d) { return color(d[0]); });
        }

 


}