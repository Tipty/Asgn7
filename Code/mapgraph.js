//Define Margin
var margin = {left: 40, right: 40, top: 20, bottom: 20 }, 
    width = 1900 - margin.left -margin.right,
    height = 550 - margin.top - margin.bottom;

//Define Color
var color = d3.scaleOrdinal(d3.schemeCategory20);

//Define SVG
var svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//Define collision
//Adds collision to nodes
var forceCollide = d3.forceCollide()
    //Collision radius
    .radius(function(d) {return d.honor;})
    //Collision strength
    .strength(2);

//Define force link
var forceLink = d3.forceLink()
    //Match link id from json
    .id(function(d) { return d.id; })
    //Link distance
    .distance(50)
    //Link strength
    .strength(.5);

//Initiate force simulation
var simulation = d3.forceSimulation()
    .force("link", forceLink)
    //Repulsion of nodes with new attribute
    .force("charge", d3.forceManyBody().strength(function(d) {return d.honor * -15;}))
    //Center nodes around the middle of the graph
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force('collision', forceCollide);
    
    
//Extrace data from json file
d3.json("miserables.json", function(error, graph) {
  //Error check
  if (error) throw error;
  //Draw Link
  var link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graph.links)
      .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });
  //Draw Node
  var node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(graph.nodes)
      .enter().append("circle")
      .attr("r", function(d) { return d.honor; })
      .attr("fill", function(d) { return color(d.group); })
      //Enable drag feature
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
  
  //Label nodes
  node.append("title")
      .text(function(d) { return d.id; });

  //Position nodes
  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);
  
  //Position links
  simulation.force("link")
      .links(graph.links);
    
  //Position nodes and links according to data
  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }
  //Button to start/stop simulation
  var button = svg.append("text")
  	  .attr("x", width - 40)             
	  .attr("y", height - 20)    
	  .attr("class", "legend")        
	  .text("Stop")
      .on("click", function(d){
         //Check if nodes are drawn
         var active = node.active ? false : true;
         //Delete them if so
         if (active == true) {
           button.text("Start")
           node.style("opacity", 0);
           link.style("opacity", 0); 
         }
         //Else, put them back
         else{
           button.text("Stop")
           node.style("opacity", 1);
           link.style("opacity", 1); 
         }
         node.active = active;

      });
});
//Match movement with position of node
function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

//Adjust node with movement
function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

//Position node after dragging is done
function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  //Disabled to allowed fixed positioning once dragged
  //Originally cancelled movement and returned
  //d.fx = null;
  //d.fy = null;
}


//}
