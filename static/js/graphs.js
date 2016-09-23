var mapboxAccessToken = "[accessToken]";

queue()
    .defer(d3.json, "/static/data/bundeslaender_connectivity.geojson")
    .await(makeGraphs);

function makeGraphs(error, connectivity) {
    if (error) {
        console.error(error);
        return;
    }

    var records = connectivity.features;

    // Create Crossfilter instance
    var ndx = crossfilter(records);

    dimensions = createDimensions(ndx);
    groups = createGroups(dimensions);

    createMeasurementsDisplay(groups.measurements);
    var bundeslandChart = createBundeslandChart(dimensions.bundesland, groups.bundesland);
    var providerChart = createProviderChart(dimensions.provider, groups.provider);

    // Add listeners to the charts so we update the map each time
    // the user selects a specific Bundesland or provider.
    dcCharts = [bundeslandChart, providerChart];
    dcCharts.forEach(function(chart) {
        chart.on("filtered", function (chart, filter) {
            map.update(dimensions.all.top(Infinity));
        });
    });

    // Display the dc graphs
    dc.renderAll();
    // Display the map
    map.init();
    map.update(dimensions.all.top(Infinity));
}

/*
 * Crossfilter helper functions
 */

var createDimensions = function(ndx) {
    var bundeslandDim = ndx.dimension(function(d) { return d.bundesland; });
    var providerDim = ndx.dimension(function(d) { return d.provider; });
    var allDim = ndx.dimension(function(d) { return d; });

    return {
        bundesland: bundeslandDim,
        provider: providerDim,
        all: allDim
    };
};

var createGroups = function(dimensions) {
    var groupByAverage = function(dimension) {
        // Functions from crossfilter documentation to reduce a group by average.
        var reduceAddAvg = function(p, v) {
            ++p.count;
            p.sum += v.properties.stability;
            p.avg = p.sum/p.count;
            return p;
        };
        var reduceRemoveAvg = function(p, v) {
            --p.count;
            p.sum -= v.properties.stability;
            p.avg = p.sum/p.count;
            return p;
        };
        var reduceInitAvg = function() {
          return {count:0, sum:0, avg:0};
        };

        return dimension.group().reduce(reduceAddAvg, reduceRemoveAvg, reduceInitAvg);
    };

    var bundeslandGroup = groupByAverage(dimensions.bundesland);
    var providerGroup = groupByAverage(dimensions.provider);
    var measurementsGroup = dimensions.all.groupAll().reduceSum(function(d) { return d.properties.measurements; });

    return {
        bundesland: bundeslandGroup,
        provider: providerGroup,
        measurements: measurementsGroup
    };
};

/*
 * Helper functions to create the graphs.
 */

var createMeasurementsDisplay = function (measurementsGroup) {
    var numberMeasurements = dc.numberDisplay("#number-measurements-nd");

    numberMeasurements
    .formatNumber(d3.format("0,000"))
    .valueAccessor(function(d) { return d; })
    .group(measurementsGroup);

    return numberMeasurements;
};

var createBaseChart = function(chartSelector, dimension, group) {
    var chart = dc.rowChart(chartSelector);

    chart
    .width(400)
    .dimension(dimension)
    .group(group)
    .ordering(function(d) { return -d.value.avg; })
    .valueAccessor(function(d) { return d.value.avg; })
    .colors(["#787878"])
    .labelOffsetY(12)
    .xAxis().tickValues([0, 0.5, 1]).ticks(3);

    return chart;
};

var createBundeslandChart = function(bundeslandDim, bundeslandGroup) {
    var bundeslandChart = createBaseChart("#bundesland-row-chart", bundeslandDim, bundeslandGroup);

    bundeslandChart
    .height(420);

    return bundeslandChart;
};

var createProviderChart = function (providerDim, providerGroup) {
    var providerChart = createBaseChart("#provider-row-chart", providerDim, providerGroup);

    providerChart
    .height(160);

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

        var had_all = filters.indexOf("All") >= 0;
        var select_all = d.key === "All";
        if (had_all || select_all) {
            // If "all" was selected or we want to select "all"
            // remove the previous filters.
            providerChart.filter(null);
        }

        // Process the click action
        oc.call(providerChart, d);
    };

    // Select "all" in the beginning since otherwise we would select every category
    // from the start which we don't want.
    providerChart.filter("All");

    return providerChart;
};

/*
 * Helper object for the map.
 */

var map = {
    init: function() {
        L.mapbox.accessToken = mapboxAccessToken;

        var germanyBounds = [
            [55, 9],
            [51, 6],
            [46, 10],
            [52, 16]
        ];
        this.map = L.mapbox.map("map").fitBounds(germanyBounds);

        // Put the zoom control in the topright corner so that we can place the menu toggle in
        // the topleft corner.
        this.map.zoomControl.removeFrom(this.map);
        new L.Control.Zoom({ position: "topright" }).addTo(this.map);

        // Add the legend with HTML specified in index.html.
        this.map.legendControl.addLegend(document.getElementById('legend').innerHTML);

        // Add our custom mapbox style.
        var styleURL = "mapbox://styles/treigerm/cisymejke004n2xlecoij4koq";
        L.mapbox.styleLayer(styleURL).addTo(this.map);

        // Add the layer on which we will display our connectivity layer.
        this.connectivityLayer = L.mapbox.featureLayer();
    },
    update: function(data) {
        // Overwrite the current GeoJSON with the new data.
        this.connectivityLayer.setGeoJSON(data).addTo(this.map);

        // Color each rail section in a shade of green determined
        // by its stability value.
        this.connectivityLayer.eachLayer(function(layer) {
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
    }
};
