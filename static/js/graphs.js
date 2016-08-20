queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);

function makeGraphs(error, records) {
    // Create Crossfilter instance
    var ndx = crossfilter(records);

    // Define dimensions
    var bundeslandDim = ndx.dimension(function(d) { return d.bundesland ? d.bundesland : ""; });

    // Group data
    var bundeslandGroup = bundeslandDim.group();
    console.log(bundeslandGroup.top(10));

    // Create charts
    /*var bundeslandChart = dc.rowChart("#bundesland-row-chart");

    bundeslandChart
    .width(300)
    .height(310)
    .dimension(bundeslandDim)
    .group(bundeslandGroup)
    */
}
