define(["arccell/MapDrawer"],function(drawer) {

var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = drawer.map.width - margin.left - margin.right,
    height = drawer.map.height/2 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//data should be a 2xN array of key/value pairs
//keys can be whatever; values should be numbers
function chart(data) {
  x.domain(data.map(function(d) { return d[0]; }));
  y.domain([0, d3.max(data, function(d) { return d[1]; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Count");

  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d[0]); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return height - y(d[1]); });
};

//raw should be a 3xN array of data;
// raw_data[n][0]=lat
// raw_data[n][1]=long
// raw_data[n][2]=enum
//output is an array that can be fed to chart(data)
function count_within_map_bounds(raw_data) {
	var ext = drawer.map.geographicExtent;
	var output = {};
	raw_data.map(
		function(d) {
			var lat = d[0];
			var long = d[1];
			//if (lat <= ext.xmax && lat >= ext.xmin &&
			//    long <= ext.ymax && long >= ext.ymin) {
					if (output.hasOwnProperty(d[2])) {
						output[d[2]]++;
					} else {
						output[d[2]] = 1;
					}
			//	}
		});
	var array = [];
	for (var prop in output) {
		if (output.hasOwnProperty(prop)) {
			array.push([prop,output[prop]]);
		}	
	}
	return array;
}

return {
    chart: chart,
	count_within_map_bounds: count_within_map_bounds
};

});
