queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);

function makeGraphs(error, geojson) {
    if (error) {
        console.error(error);
        return;
    }

    var records = geojson.features;

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
    .formatNumber(d3.format("d"))
    .valueAccessor(function(d) { return d; })
    .group(measurementsGroup);

    bundeslandChart
    .width(400)
    .height(420)
    .dimension(bundeslandDim)
    .group(bundeslandGroup)
    .ordering(function(d) { return -d.value.avg; })
    .valueAccessor(function(d) { return d.value.avg; })
    .colors(['#6baed6'])
    .labelOffsetY(12)
    .xAxis().tickValues([0, 0.5, 1]).ticks(3);

    providerChart
    .width(400)
    .height(280)
    .dimension(providerDim)
    .group(providerGroup)
    .ordering(function(d) { return -d.value.avg; })
    .valueAccessor(function(d) { return d.value.avg; })
    .colors(['#6baed6'])
    .labelOffsetY(12)
    .xAxis().tickValues([0, 0.5, 1]).ticks(3);

    L.mapbox.accessToken = "pk.eyJ1IjoidHJlaWdlcm0iLCJhIjoiY2lzNXU4bzllMDAwZTJ5bXcwajA1ZjdvYSJ9.OA1zmwAiQpIqL3tcHmBddg";
    var map = L.mapbox.map("map", "mapbox.streets");
    var connectivityLayer = L.mapbox.featureLayer();

    var drawMap = function() {
        map.setView([51.9, 10.26], 5);

        connectivityLayer.setGeoJSON(allDim.top(Infinity)).addTo(map);
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

    for (i = 0; i < dcCharts.length; i++) {
        dcCharts[i].on("filtered", function (chart, filter) {
            drawMap();
        });
    }

    // Display the dc graphs
    dc.renderAll();
}

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
