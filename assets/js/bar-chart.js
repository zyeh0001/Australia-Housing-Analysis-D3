"use strict";
const smallDeviceWidth = 450;
var margin =
    window.innerWidth < smallDeviceWidth ?
        {
            top: 10,
            right: 70,
            bottom: 10,
            left: 80
        } :
        {
            top: 20,
            right: 80,
            bottom: 20,
            left: 120
        };
var barValueMargin = window.innerWidth < smallDeviceWidth ? 30 : 40;
var animationInterval = 900,
    yearFontSize = 5;
var width = 700;
var height = window.innerHeight * 0.8 - margin.top - margin.bottom;

const leftPadding = 5,
    speedValues = {
        1: 1800,
        2: 1500,
        3: 1200,
        4: 900,
        5: 600
    };
const delay = function (data, index) {
    return index * 10;
};
var interval,
    showYears = true;
const transitionDuration = d3
    .transition()
    .duration(animationInterval / 2);

var svg = d3
    .select("#barChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left - 50},${margin.top})`);

var race_bar = svg;
var xScale = d3.scaleLinear().range([0, width]);

var yScale = d3
    .scaleBand()
    .rangeRound([0, height], 0.1)
    .padding(0.1);

const dataFile = "assets/data/bar_chart_race_data.csv";
//  const colors = d3.scaleOrdinal().range(d3.schemeSet2);
const colors = d3.scaleOrdinal(d3.schemeCategory20)

// const colors = d3.scaleOrdinal(d3.schemePaired);

let chartData = {};
window.addEventListener("load", function (event) {
    // document
    //     .querySelector("#replay")
    //     .addEventListener("click", function(clickEvent) {
    //         hideReplay();
    //         startBarChartRace();
    //     });
    // hideReplay();
    // console.log("create bar chart race")
    createBarChartRace();
});

function clearContainer() {
    race_bar.selectAll("*").remove();
}

function isEmpty(value) {
    return value === undefined || value === null || value === "";
}


function createBarChartRace() {
    let axisLabels = [];
    // let hasIconColumn = true;
    // let icons = [];

    d3.csv(dataFile, function (data) {
        data.forEach(function (d) {
            Object.keys(d).forEach(function (key) {
                // console.log("data[key]", d[key])
                if (key === "city_name" && d[key] != "") {
                    axisLabels.push(d[key]);
                }

            });
        });
        data.forEach(function (d, index) {
            Object.keys(d).forEach(function (key) {
                if (d[key] != "" && key != "city_name") {
                    if (chartData[key]) {
                        chartData[key].push({
                            name: axisLabels[index],
                            // icon: icons[index],
                            value: d[key],
                            fillColor: colors(index)
                        });

                    } else {
                        chartData[key] = [];
                    }
                }


            });
        });
        startBarChartRace();
    });

}



function startBarChartRace() {
    stopBarChartRace();
    clearContainer();
    const years = Object.keys(chartData).map(d => d);
    const lastYear = years[years.length - 1];
    let yearCount = 0;
    let startYear = years[yearCount];
    let selectedData = sortData(chartData[startYear]);
    drawChart(startYear, selectedData);
    interval = d3.interval(() => {
        startYear = years[++yearCount];
        selectedData = sortData(chartData[startYear]);
        drawChart(startYear, selectedData);
        if (startYear === lastYear) {
            stopBarChartRace();
            // showReplay();
        }
    }, animationInterval);
}

function stopBarChartRace() {
    if (interval) {
        interval.stop();
    }
}

function drawChart(startYear, selectedData) {
    let maxChartValue = Math.max(
        ...selectedData.map(function (data) {
            return isNaN(xAccessor(data)) ? 0 : xAccessor(data);
        })
    );
    xScale.domain([0, maxChartValue]);
    drawXAxis();
    if (showYears) {
        d3.select(".year")
            .text(startYear)
        // .style(
        //     "font-size",
        //     window.innerWidth < smallDeviceWidth ?
        //     "30px" :
        //     yearFontSize + "vw"
        // );
    }
    yScale.domain(selectedData.map(yAccessor));
    drawYAxis();
    drawBars(selectedData);
}

function sortData(data) {
    if (data) {
        return removeEmptyRows(
            data
                .sort((a, b) => b.value - a.value)
                .slice(0, Math.min(10, data.length))
        );
    }
}

function removeEmptyRows(sortedData) {
    return sortedData.filter(function (data) {
        return data.value > 0;
    });
}

function xAccessor(d) {
    return Number(d.value);
}

function yAccessor(d) {
    return d.name;
}

function drawXAxis() {
    let axis = race_bar.select(".axis--x");
    if (axis.empty()) {
        axis = race_bar
            .append("g")
            .attr("class", "axis axis--x")
            .attr(
                "transform",
                `translate(${leftPadding},${height + 230})`
            );
    }
    axis.transition(transitionDuration)
        .call(
            d3.axisBottom(xScale).tickFormat(function (xLabel) {
                let format = d3.format(".2s");
                if (window.innerWidth < smallDeviceWidth) {
                    return "";
                } else {
                    return format(xLabel);
                }
            })
        )
        .selectAll("g")
        .delay(delay);
}

function drawYAxis() {
    let axis = race_bar.select(".axis--y");
    if (axis.empty()) {
        axis = race_bar.append("g").attr("class", "axis axis--y");
    }
    axis.transition(transitionDuration)
        .call(
            d3.axisLeft(yScale).tickFormat(function (yLabel) {
                let textLimit =
                    window.innerWidth < smallDeviceWidth ? 15 : 20;
                return yLabel.length < textLimit ?
                    yLabel :
                    yLabel.substr(0, textLimit - 3) + "...";
            })
        )
        .selectAll("g")
        .delay(delay);
}

function drawBars(data) {
    let barsG = race_bar.select(".bars-g");
    if (barsG.empty()) {
        barsG = race_bar.append("g").attr("class", "bars-g");
    }

    const bars = barsG.selectAll(".bar").data(data, yAccessor);
    bars.exit().remove();
    bars.enter()
        .append("rect")
        .attr("x", leftPadding)
        .attr("class", "bar")
        .style("fill", function (d) {
            return d.fillColor;
        })
        .merge(bars)
        .transition(transitionDuration)
        .attr("y", d => yScale(yAccessor(d)))
        .attr("width", d => xScale(xAccessor(d)))
        .attr("height", yScale.bandwidth())
        .delay(delay);

    const values = barsG.selectAll(".value").data(data, yAccessor);
    values.exit().remove();
    values
        .enter()
        .append("text")
        .attr("class", "value inside_value")
        .attr("text-anchor", "middle")
        .merge(values)
        .transition(transitionDuration)
        .attr("y", function (d) {
            return yScale(yAccessor(d)) + yScale.bandwidth() / 1.4;
        })
        .attr("x", function (d) {
            return xScale(xAccessor(d)) - barValueMargin - 20;
        })
        .text(function (d) {
            return xAccessor(d).toLocaleString("en-US");
        })

}

// function showReplay() {
//     document.querySelector("#replay").style.display = "block";
// }

function hideReplay() {
    document.querySelector("#replay").style.display = "none";
}

function repeatDisplay() {
    startBarChartRace()
}