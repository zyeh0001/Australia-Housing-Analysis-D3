

var data_map = d3.map();


d3.queue()
    .defer(d3.json, "assets/data/viclocalitysim.json")
    .defer(d3.csv, "assets/data/Australia univeresity ranking 2000.csv")
    .defer(d3.csv, "assets/data/uni_map.csv", function (d) {
        // Convert to number
        d['value'] = +d['value'];
        return data_map.set(d['locality'].toUpperCase(), d);
    })
    .await(function (error, map_json, data_csv, uni_map) {
        // How does the data look like?
        // console.log(data_csv);
        // console.log(uni_map);

        var mel_uni = []
        for (var i = 0; i < data_csv.length; i++) {
            if (data_csv[i]['City'] == 'Melbourne') {
                mel_uni.push(data_csv[i])
            }
        }
        // console.log(mel_uni);
        // Unpack the GeoJSON features
        var suburb = map_json['features'];
        // console.log(suburb);

        // SVG setup
        var width = 900,
            height = 600;

        // variables for catching min and max zoom factors
        var minZoom;
        var maxZoom;
        // Define map zoom behaviour
        var zoom = d3
            .zoom()
            .scaleExtent([1, 15])
            .on("zoom", zoomed)
            ;

        var svg = d3.select('#uniMap').append('svg')
            .attr('width', width)
            .attr('height', height);

        // console.log('svg created');

        // Geography setup
        var proj = d3.geoMercator()
            .center([145.2, -38])
            .scale(24000)
            .translate([width / 2, height / 2]);

        var path_gen = d3.geoPath(proj);


        // Scale setup
        var colors = ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb',
            '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'];
        var all_values = data_map.values().map(function (d) {
            return d['value'];
        });

        // Quantile scale
        var color_scale = d3.scaleQuantile()
            .domain(all_values)
            .range(colors);

        // Create function to apply zoom to countriesGroup
        function zoomed() {
            svg.selectAll('path')
                .attr('transform', d3.event.transform);
            svg.selectAll("circle")
                .attr('transform', d3.event.transform);
        }

        // zoom to show a bounding box, with optional additional padding as percentage of box size
        function boxZoom(box, centroid, paddingPerc) {
            minZoom = Math.max($("#map").width() / width, $("#map").height() / height);
            maxZoom = 20 * minZoom;
            minXY = box[0];
            maxXY = box[1];
            // find size of map area defined
            zoomWidth = Math.abs(minXY[0] - maxXY[0]);
            zoomHeight = Math.abs(minXY[1] - maxXY[1]);
            // find midpoint of map area defined
            zoomMidX = centroid[0];
            zoomMidY = centroid[1];
            // increase map area to include padding
            zoomWidth = zoomWidth * (1 + paddingPerc / 100);
            zoomHeight = zoomHeight * (1 + paddingPerc / 100);
            // find scale required for area to fill svg
            maxXscale = $("svg").width() / zoomWidth;
            maxYscale = $("svg").height() / zoomHeight;
            zoomScale = Math.min(maxXscale, maxYscale);
            // handle some edge cases
            // limit to max zoom (handles tiny countries)
            zoomScale = Math.min(zoomScale, maxZoom);
            // limit to min zoom (handles large countries and countries that span the date line)
            zoomScale = Math.max(zoomScale, minZoom);
            // Find screen pixel equivalent once scaled
            offsetX = zoomScale * zoomMidX;
            offsetY = zoomScale * zoomMidY;
            // Find offset to centre, making sure no gap at left or top of holder
            dleft = Math.min(0, $("svg").width() / 2 - offsetX);
            dtop = Math.min(0, $("svg").height() / 2 - offsetY);
            // Make sure no gap at bottom or right of holder
            dleft = Math.max($("svg").width() - width * zoomScale, dleft);
            dtop = Math.max($("svg").height() - height * zoomScale, dtop);
            // set zoom
            svg
                .transition()
                .duration(500)
                .call(
                    zoom.transform,
                    d3.zoomIdentity.translate(dleft, dtop).scale(zoomScale)
                );
        }

        // The map, finally!
        svg.selectAll('path')
            .data(suburb)
            .enter()
            .append('path')
            .attr('d', path_gen)
            .style('fill', function (d) {
                sub_name = d['properties']['VIC_LOCA_2'].toUpperCase();

                // Color only if the data exists for the FIPS code
                if (data_map.has(sub_name)) {
                    // Get the entire row of poverty data for each FIPS code
                    poverty_data = data_map.get(sub_name);

                    // Get the specific feature
                    data = poverty_data['value'];

                    return color_scale(data);
                };
            })
            .style('opacity', 0.8)
            .style('stroke', 'white')
            .style('stroke-width', 1)
            .style('stroke-opacity', 0.2)
            .on("click", function (d, i) {
                d3.selectAll(".country").classed("country-on", false);
                d3.select(this).classed("country-on", true);
                boxZoom(path_gen.bounds(d), path_gen.centroid(d), 20);
            })
            .on('mouseover', function (d) {
                // Make the county color darker
                d3.select(this)
                    .style("opacity", 1)
                    .style("stroke", "white")
                    .style("stroke-width", 5);

                //change suburb color to orange
                d3.select(this)
                    .style("fill", "orange");

                // Unload data
                sub_name = d['properties']['VIC_LOCA_2'].toUpperCase();
                var name;
                var poverty_rate;


                if (data_map.has(sub_name)) {
                    poverty_data = data_map.get(sub_name);
                    name = poverty_data['locality'];
                    poverty_rate = poverty_data['value'];
                    // Show the tooltip
                    d3.select('.tooltip')
                        .style('visibility', 'visible')
                        .style('top', d3.event.pageY + 10 + 'px')
                        .style('left', d3.event.pageX + 10 + 'px')
                        .html('<strong>' + name + '</strong><br />Avg Housing price: ' + poverty_rate);
                }
                else {
                    d3.select('.tooltip')
                        .style('visibility', 'visible')
                        .style('top', d3.event.pageY + 10 + 'px')
                        .style('left', d3.event.pageX + 10 + 'px')
                        .html('<strong> No Suburb Data</strong>');
                }



            })
            .on('mouseout', function (d) {
                // Make the county usual opacity again
                d3.select(this)
                    .style("opacity", 0.8)
                    .style("stroke", "white")
                    .style("stroke-width", 0.3);

                // Hide the tooltip
                d3.select('.tooltip')
                    .style('visibility', 'hidden');
                //change the color back
                d3.select(this)
                    .style('fill', function (d) {
                        sub_name = d['properties']['VIC_LOCA_2'].toUpperCase();

                        // Color only if the data exists for the FIPS code
                        if (data_map.has(sub_name)) {
                            // Get the entire row of poverty data for each FIPS code
                            poverty_data = data_map.get(sub_name);

                            // Get the specific feature
                            data = poverty_data['value'];

                            return color_scale(data);
                        }
                    });
            });
        var location = []
        for (var i = 0; i < mel_uni.length; i++) {
            if (mel_uni[i]['Longitute'] && mel_uni[i]['Latitute']) {
                location.push([mel_uni[i]['Longitute'], mel_uni[i]['Latitute']]);
            }
        }

        //add university dots on map
        svg.selectAll("circle")
            .data(location)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return proj(d)[0]; })
            .attr("cy", function (d) { return proj(d)[1]; })
            .attr("r", "4px")
            .attr("fill", "red")
            .style("stroke", "white")
            .style("stroke-width", 1)
            .on('mouseover', function (d) {
                //make obvious
                d3.select(this)
                    .style("opacity", 1)
                    .style("stroke", "white")
                    .style("stroke-width", 3);
                //show tooptip
                for (var i = 0; i < mel_uni.length; i++) {
                    if (d[0] == mel_uni[i]['Longitute']) {
                        // Show the tooltip
                        // console.log('find match')
                        d3.select('.tooltip')
                            .style('visibility', 'visible')
                            .style('top', d3.event.pageY + 10 + 'px')
                            .style('left', d3.event.pageX + 10 + 'px')
                            .html('<strong> ' + mel_uni[i]['Institution'] + '</strong>');
                    }
                }

            })
            .on('mouseout', function (d) {
                // Make the county usual opacity again
                d3.select(this)
                    .style("opacity", 0.8)
                    .style("stroke", "white")
                    .style("stroke-width", 0.5);

                // Hide the tooltip
                d3.select('.tooltip')
                    .style('visibility', 'hidden');

                // initiateZoom();
            });


        // add legend
        var g = svg.append("g")
            .attr("class", "legendThreshold2")
            .attr("transform", "translate(20,20)");
        g.append("text")
            .attr("class", "caption")
            .attr("x", 0)
            .attr("y", -6)
            .text("Average Housing price");
        var labels = ['< 500k', '500k - 600k', '600k - 670k', '670k - 740k', '740k - 820k', '820k - 900k', '900k - 1.1M', '1.1M - 1.3M', '> 1.3M'];
        var legend = d3.legendColor()
            .labels(function (d) { return labels[d.i]; })
            .shapePadding(4)
            .scale(color_scale);
        svg.select(".legendThreshold2")
            .call(legend);

        svg.call(zoom);
    });
