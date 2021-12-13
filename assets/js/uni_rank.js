
// set the dimensions and margins of the graph
var margin = { top: 20, right: 30, bottom: 40, left: 200 },
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;



d3.csv("assets/data/Australia univeresity ranking 2000.csv", function (data) {
    // append the svg object to the body of the page
    var svg = d3.select("#uni_rank")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    // console.log(data);
    var uni_rank_bar = svg
        .selectAll()
        .data(data)
        .enter()
        .append('g');

    var colorScale = d3.scaleOrdinal(d3.schemeCategory20b)
    // Add X axis
    var x = d3.scaleLinear()
        .domain([0, 1900])
        .range([0, width]);
    uni_rank_bar.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Y axis
    var y = d3.scaleBand()
        .range([0, height])
        .domain(data.map(function (d) { return d.Institution; }))
        .padding(.4);

    uni_rank_bar.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .attr("font-family", "sans-serif")
        .attr("font-size", "8px");


    //Bars
    uni_rank_bar
        .append("rect")
        .attr("x", x(0))
        .attr("y", function (d) { return y(d.Institution); })
        .attr("width", function (d) { return width - x(0); })
        .attr("height", y.bandwidth())
        .attr("fill", function (d) {
            return colorScale((+d.RANK))
        })
        .style("stroke", "white")
        .style("stroke-width", 0.3);


    //add text to x and y axis
    uni_rank_bar
        .append("text")
        .data(data)
        .text(function (d) {
            // console.log(d.RANK)
            return d.RANK;
        })
        .attr("x", function (d) {
            return x(d.RANK) + 15;
        })
        .attr("y", function (d) {
            // console.log(d);
            return y(d.Institution) + y.bandwidth() * (0.5 + 0.4); // here 0.1 is the padding scale
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "8px")
        .attr("fill", "black")
        .attr("text-anchor", "middle");

    uni_rank_bar.selectAll("rect")
        .on('mouseover', function (d) {
            d3.select(this)
                .style("fill", "orange")
                .style("stroke", "white")
                .style("stroke-width", 2)

            //show tooptip
            for (var i = 0; i < data.length; i++) {
                if (d['RANK'] == data[i]['RANK']) {
                    // Show the tooltip
                    // console.log('find match')
                    d3.select('.tooltip')
                        .style('visibility', 'visible')
                        .style('top', d3.event.pageY + 10 + 'px')
                        .style('left', d3.event.pageX + 10 + 'px')
                        .html('<strong> ' + data[i]['RANK'] + " " + data[i]['Institution'] + '</strong>');
                }
            }


        })
        .on('mouseout', function (d) {
            d3.select(this)
                .style("fill", colorScale((+d.RANK)))
                .style("stroke", "white")
                .style("stroke-width", 0.3)
                .attr("height", y.bandwidth());

            d3.select('.tooltip')
                .style('visibility', 'hidden');
        });


    //start animation
    uni_rank_bar.selectAll("rect")
        .transition()
        .duration(800)
        .attr("x", x(0))
        .attr("width", function (d) { return x(d.RANK); })
        .delay(function (d, i) { return (i * 1000) })



})
