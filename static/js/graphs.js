queue()
    .defer(d3.json, "/static/data/bundeslaender_connectivity.geojson")
    .await(makeGraphs);

// TODO: Refactoring

function makeGraphs(error, connectivity) {
    if (error) {
        console.error(error);
        return;
    }

    var records = connectivity.features;

    // Create Crossfilter instance
    var ndx = crossfilter(records);

    // Define dimensions
    var bundeslandDim = ndx.dimension(function(d) { return d.bundesland; });
    var providerDim = ndx.dimension(function(d) { return d.provider; });
    var allDim = ndx.dimension(function(d) { return d; });

    // Group data
    var bundeslandGroup = bundeslandDim.group()
                                       .reduce(reduceAddAvg, reduceRemoveAvg, reduceInitAvg);

    var providerGroup = providerDim.group()
                                   .reduce(reduceAddAvg, reduceRemoveAvg, reduceInitAvg);

    var measurementsGroup = ndx.groupAll().reduceSum(function(d) { return d.properties.measurements; });

    // Create charts
    var numberMeasurements = dc.numberDisplay("#number-measurements-nd");
    var bundeslandChart = dc.rowChart("#bundesland-row-chart");
    var providerChart = dc.rowChart("#provider-row-chart");

    numberMeasurements
    .formatNumber(d3.format("0,000"))
    .valueAccessor(function(d) { return d; })
    .group(measurementsGroup);

    bundeslandChart
    .width(400)
    .height(420)
    .dimension(bundeslandDim)
    .group(bundeslandGroup)
    .ordering(function(d) { return -d.value.avg; })
    .valueAccessor(function(d) { return d.value.avg; })
    .colors(["#787878"])
    .labelOffsetY(12)
    .xAxis().tickValues([0, 0.5, 1]).ticks(3);

    providerChart
    .width(400)
    .height(160)
    .dimension(providerDim)
    .group(providerGroup)
    .ordering(function(d) { return -d.value.avg; })
    .valueAccessor(function(d) { return d.value.avg; })
    .colors(["#787878"])
    .labelOffsetY(12)
    .xAxis().tickValues(d3.range(0, 1.5, 0.5)).ticks(3);

    L.mapbox.accessToken = "pk.eyJ1IjoidHJlaWdlcm0iLCJhIjoiY2lzeXAzNHQ4MDA0ZjJ5cGRmZ2F1NzV6YSJ9.ArS225n_3FVtM2TigmTing";

    var germanyBounds = [
        [55, 9],
        [51, 6],
        [46, 10],
        [52, 16]
    ];
    var map = L.mapbox.map("map").fitBounds(germanyBounds);

    map.zoomControl.removeFrom(map);
    new L.Control.Zoom({ position: "topright" }).addTo(map);

    map.legendControl.addLegend(document.getElementById('legend').innerHTML);

    var styleURL = "mapbox://styles/treigerm/cisymejke004n2xlecoij4koq";
    L.mapbox.styleLayer(styleURL).addTo(map);

    var connectivityLayer = L.mapbox.featureLayer();

    var drawMap = function() {
        // Add all selected rails
        connectivityLayer.setGeoJSON(allDim.top(Infinity)).addTo(map);

        connectivityLayer.eachLayer(function(layer) {
            var color;
            if (layer.feature.properties.stability < 0.9) {
                color = "#A2EB80";
            } else if (layer.feature.properties.stability < 0.95) {
                color = "#79CC53";
            } else {
                color = "#55A72F";
            }

            layer.setStyle({
                color: color
            });
        });
    };

    // Ensure that if "all" is selected and you click on another provider
    // we deselect all again.
    var oc = providerChart.onClick;
    providerChart.onClick = function(d) {
        var filters = providerChart.filters();

        var is_last = filters.length === 1;
        var deselect = d.key === filters[0];
        if (is_last && deselect) {
            // If this is the last selected provider
            // and we want to deselect it, then we do nothing.
            return;
        }

        var had_all = filters.indexOf("all") >= 0;
        var select_all = d.key === "all";
        if (had_all || select_all) {
            // If "all" was selected or we want to select "all"
            // remove the previous filters.
            providerChart.filter(null);
        }

        // Process the click action
        oc.call(providerChart, d);
    };
    // Select "all" in the beginning
    providerChart.filter("all");

    drawMap();

    dcCharts = [bundeslandChart, providerChart];

    dcCharts.forEach(function(chart) {
        chart.on("filtered", function (chart, filter) {
            drawMap();
        });
    });

    // Display the dc graphs
    dc.renderAll();
}

$(document).ready(function() {
    $("#nav-toggle").click(function () {
        $(".map-wrapper").toggleClass("toggle");
    });
});

// Functions from crossfilter documentation to reduce a group by average

function reduceAddAvg(p, v) {
    ++p.count;
    p.sum += v.properties.stability;
    p.avg = p.sum/p.count;
    return p;
}

function reduceRemoveAvg(p, v) {
    --p.count;
    p.sum -= v.properties.stability;
    p.avg = p.sum/p.count;
    return p;
}

function reduceInitAvg() {
  return {count:0, sum:0, avg:0};
}
