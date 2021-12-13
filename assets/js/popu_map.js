var data_map = d3.map();


d3.queue()
    .defer(d3.json, "assets/data/aus_lga.json")
    .defer(d3.csv, "assets/data/city_location.csv")
    .defer(d3.csv, "assets/data/city_htype_price.csv")
    .defer(d3.csv, "assets/data/au_lga_population.csv", function (d) {
        // Convert to number
        d['2019ERP'] = +d['2019ERP'];
        return data_map.set(d['LGAcode'], d);
    })
    .await(function (error, map_json, city_loc, pie_data, pop_map) {
        // How does the data look like?
        // console.log(pop_map);
        // console.log(city_loc);
        // console.log(pie_data);
        // Unpack the GeoJSON features
        var Lga = map_json['features'];
        // console.log(Lga);
        //----------------------------------------
        // SVG setup
        var width = 900,
            height = 600;


        var svg = d3.select('#map').append('svg')
            .attr('width', width)
            .attr('height', height);

        // console.log('svg created');


        // Pie chart variables:
        var radius = 45;
        var arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        var pie = d3.pie()
            .sort(null)
            .value(function (d) { return d; });


        // Geography setup
        var proj = d3.geoMercator()
            .center([132, -28])
            .scale(1000)
            .translate([width / 2, height / 2]);

        var path_gen = d3.geoPath(proj);

        // color Scale setup
        var colors = ['#ffffcc', '#ffeda0', '#fed976', '#feb24c',
            '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'];
        var all_values = data_map.values().map(function (d) {
            return d['2019ERP'];
        });
        // console.log(all_values);

        // Quantile scale
        var color_scale = d3.scaleQuantile()
            .domain(all_values)
            .range(colors);

        // The map 
        svg.selectAll('path')
            .data(Lga)
            .enter()
            .append('path')
            .attr('d', path_gen)
            .style('fill', function (d) {
                lga_code = d['properties']['LGA_CODE11'];

                // Color only if the data exists for the FIPS code
                if (data_map.has(lga_code)) {
                    // Get the entire row of poverty data for each FIPS code
                    population_data = data_map.get(lga_code);

                    // Get the specific feature
                    data = population_data['2019ERP'];

                    return color_scale(data);
                }
                else {
                    return '#d9d9d9'
                }
            })
            .style('opacity', 0.8)
            .style('stroke', 'black')
            .style('stroke-width', 0.8)
            .style('stroke-opacity', 0.2)
            .on('mouseover', function (d) {
                // Make the lga stroke color change
                d3.select(this)
                    .style("opacity", 1)
                    .style("stroke", "#810f7c")
                    .style("stroke-width", 1)
                    .style('stroke-opacity', 1);


                //prepare data
                lga_code = d['properties']['LGA_CODE11'];
                var name;
                var density_rate;
                if (data_map.has(lga_code)) {
                    population_data = data_map.get(lga_code);
                    name = population_data['LGA'];
                    density_rate = parseInt(population_data['2019ERP']);
                    // Show the tooltip
                    d3.select('.tooltip')
                        .style('visibility', 'visible')
                        .style('top', d3.event.pageY + 10 + 'px')
                        .style('left', d3.event.pageX + 10 + 'px')
                        .html('<strong>' + name + '</strong><br />population: ' + density_rate);

                    document.getElementById("sub_pop").innerHTML = "Local Government Area population: " + density_rate;
                }
                else {
                    d3.select('.tooltip')
                        .style('visibility', 'visible')
                        .style('top', d3.event.pageY + 10 + 'px')
                        .style('left', d3.event.pageX + 10 + 'px')
                        .html('<strong> No Lga Data</strong>');
                }

            })
            .on('mouseout', function (d) {
                // Make the county usual opacity again
                d3.select(this)
                    .style('opacity', 0.8)
                    .style('stroke', 'black')
                    .style('stroke-width', 0.8)
                    .style('stroke-opacity', 0.2)

                // Hide the tooltip
                d3.select('.tooltip')
                    .style('visibility', 'hidden');
                //change the color back
                d3.select(this)
                    .style('fill', function (d) {
                        lga_code = d['properties']['LGA_CODE11'];

                        // Color only if the data exists for the FIPS code
                        if (data_map.has(lga_code)) {
                            // Get the entire row of poverty data for each FIPS code
                            population_data = data_map.get(lga_code);

                            // Get the specific feature
                            data = population_data['2019ERP'];

                            return color_scale(data);
                        }
                        else {
                            return '#d9d9d9'
                        }
                    });
            });


        //initial pie chart
        var pie_chart = svg.append("g"); //pie chart
        // prepare data
        var city_data = [];
        for (var i = 0; i < pie_data.length; i++) {
            if (pie_data[i]['city']) {
                city_data.push({
                    "City": pie_data[i]['city'],
                    "Unit": pie_data[i]['unit'],
                    "House": pie_data[i]['house'],
                    "Townhouse": pie_data[i]['townhouse']
                });
            }
        }
        // console.log("city data: ", city_data);
        //define pie chart
        var pie_color = d3.schemeCategory10;
        var points = pie_chart.selectAll("g")
            .data(pie_data)
            .enter()
            .append("g")
            .attr("transform", function (d) { return "translate(" + proj([d.lon, d.lat]) + ")" })
            .attr("class", function (d, i) { return "pies toggle toggle" + i; })
            .style("opacity", 1)
            .attr("visibility", "hidden");

        //add title of the pie chart
        points.append("text")
            .attr("y", radius + 20)
            .text(function (d) { return d.city })
            .style('text-anchor', 'middle')
            .attr("class", function (d, i) { return "toggle toggle" + i; })

        //add the dot of the city
        points.append("circle")
            .attr("r", 8)
            .attr("fill", "#8c6bb1")
            .style("stroke", "white")
            .style("stroke-width", 1)
            .attr("visibility", "visible")
            .on("click", function (d, i) {
                d3.selectAll('.toggle')
                    .attr('visibility', 'hidden');
                d3.selectAll(".toggle" + i)
                    .attr('visibility', 'visible');
                //change the html object text
                document.getElementById("avg_p").innerHTML = "Average Housing Price: " + d.total;
            })
            .style("display", "inline")
            .style("cursor", "pointer")
            .on('mouseover', function (d) {
                //make obvious
                d3.select(this)
                    .attr("r", 15)
                    .style("stroke", "white")
                    .style("stroke-width", 3);
                //show tooptip
                for (var i = 0; i < pie_data.length; i++) {
                    if (d['lon'] == pie_data[i]['lon']) {
                        // Show the tooltip
                        // console.log('find match')
                        d3.select('.tooltip')
                            .style('visibility', 'visible')
                            .style('top', d3.event.pageY + 10 + 'px')
                            .style('left', d3.event.pageX + 10 + 'px')
                            .html('<strong> ' + pie_data[i]['city'] + '</strong>');
                    }
                }

            })
            .on('mouseout', function (d) {
                // Make the county usual opacity again
                d3.select(this)
                    .attr("r", 8)
                    .style("stroke", "white")
                    .style("stroke-width", 0.5);

                // Hide the tooltip
                d3.select('.tooltip')
                    .style('visibility', 'hidden');

                // initiateZoom();
            });;

        //draw each slice of pie
        var pies = points.selectAll(".pies")
            .data(function (d) { return pie(d.data.split(['-'])); })
            .enter()
            .append('g')
            .attr('class', 'arc');
        //fill color for each piece
        pies.append("path")
            .attr('d', arc)
            .attr("fill", function (d, i) {
                return pie_color[i + 1];
            })
            .style("stroke", "black")
            .style("stroke-width", 3);

        //add text to each slice
        pies
            .append('text')
            .text(function (d) {
                // console.log("dddd:  ", d);
                if (d.index == 0)
                    return "U:" + d.data + "%";
                else if (d.index == 1)
                    return "TH:" + d.data + "%";
                else
                    return "H:" + d.data + "%";
            })
            .attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; })
            .style("text-anchor", "middle")
            .style("fill", "white")
            .style("font-size", 10)

        //add bar legend
        svg.append("circle").attr("cx", 20).attr("cy", 530).attr("r", 6).style("fill", pie_color[1])
        svg.append("circle").attr("cx", 20).attr("cy", 560).attr("r", 6).style("fill", pie_color[2])
        svg.append("circle").attr("cx", 20).attr("cy", 590).attr("r", 6).style("fill", pie_color[3])
        svg.append("text").attr("x", 40).attr("y", 530).text("Unit").style("font-size", "15px").attr("alignment-baseline", "middle")
        svg.append("text").attr("x", 40).attr("y", 560).text("TownHouse").style("font-size", "15px").attr("alignment-baseline", "middle")
        svg.append("text").attr("x", 40).attr("y", 590).text("House").style("font-size", "15px").attr("alignment-baseline", "middle")



        // add legend
        var g = svg.append("g")
            .attr("class", "legendThreshold")
            .attr("transform", "translate(20,20)");
        g.append("text")
            .attr("class", "caption")
            .attr("x", 0)
            .attr("y", -6)
            .text("2019 Estimate Population");
        var labels = ['< 1k', '1k - 2k', '2k - 4.5k', '4.5k - 10k', '10k - 16k', '16k - 30k', '30k - 52k', '52k - 120k', '> 120k'];
        var legend = d3.legendColor()
            .labels(function (d) { return labels[d.i]; })
            .shapePadding(4)
            .scale(color_scale);
        svg.select(".legendThreshold")
            .call(legend)


    });
