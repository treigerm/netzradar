queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);

function makeGraphs(error, geojson) {
    if (error) {
        console.error(error);
        return;
    }

    var records = geojson.features;
    records.forEach(function(d) {
        d.properties.all_stability = parseFloat(d.properties.all_stability);
        d.geometry.coordinates.forEach(function(coords) {
            coords[0] = +coords[0];
            coords[1] = +coords[1];
        });
    });

    // Create Crossfilter instance
    var ndx = crossfilter(records);

    // Define dimensions
    var bundeslandDim = ndx.dimension(function(d) { return d.bundesland ? d.bundesland : ""; });

    // Group data
    var stability = "all_stability";
    var bundeslandGroup = bundeslandDim.group()
    .reduce(reduceAddAvg(stability), reduceRemoveAvg(stability), reduceInitAvg);

    // Create charts
    var bundeslandChart = dc.rowChart("#bundesland-row-chart");

    bundeslandChart
    .width(400)
    .height(420)
    .dimension(bundeslandDim)
    .group(bundeslandGroup)
    .ordering(function(d) { return -d.value.avg; })
    .valueAccessor(function(d) { return d.value.avg; })
    .colors(['#6baed6'])
    .labelOffsetY(12)
    .xAxis().tickValues([0, 0.5, 1]);

    dc.renderAll();
}

function reduceAddAvg(attr) {
  return function(p,v) {
    ++p.count;
    p.sum += v.properties[attr];
    p.avg = p.sum/p.count;
    return p;
  };
}
function reduceRemoveAvg(attr) {
  return function(p,v) {
    --p.count;
    p.sum -= v.properties[attr];
    p.avg = p.sum/p.count;
    return p;
  };
}
function reduceInitAvg() {
  return {count:0, sum:0, avg:0};
}
