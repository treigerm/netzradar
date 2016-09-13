# This script deletes all connectivity data from the main "Netzradar" dataset so that
# we are only left with the geographical data of each rail section. We will use this
# shrinked dataset to create a tileset of the railroad system. We will the add this
# tileset to our Mapbox map in Mapbox Studio. We had to create our own tileset because:
# 1. We can make sure that the railway data will consistent.
# 2. The Mapbox rails data is only viewable from zoom level 7 and onwards. But we want to
#    have zoom level up to at least 5.
import json
from tqdm import tqdm

with open("connectivity.geojson") as f:
    data = json.load(f)


def simplifyFeature(feature):
    return {
        "type": "Feature",
        "geometry": feature["geometry"],
        "properties": {}
    }

featureCollection = {
    "type": "FeatureCollection",
    "features": []
}

for feature in tqdm(data["features"]):
    featureCollection["features"].append(simplifyFeature(feature))

with open("base_rails.geojson", "w+") as f:
    json.dump(featureCollection, f)
