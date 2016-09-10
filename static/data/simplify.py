import json
from tqdm import tqdm

with open("bundeslaender_connectivity.geojson") as f:
    data = json.load(f)


def simplifyFeature(feature):
    return {
        "type": "Feature",
        "geometry": feature["geometry"],
        "p": [feature["properties"]["stability"],
              feature["properties"]["measurements"],
              feature["provider"],
              feature["bundesland"]]
    }

featureCollection = {
    "type": "FeatureCollection",
    "features": []
}

for feature in tqdm(data["features"]):
    featureCollection["features"].append(simplifyFeature(feature))

with open("simple_connectivity.geojson", "w+") as f:
    json.dump(featureCollection, f)

# TODO: Transform decimals into percent values
