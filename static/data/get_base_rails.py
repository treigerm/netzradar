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
