import json
from tqdm import tqdm

providers = ["t-mobile", "vodafone", "o2", "e-plus", "all"]

with open("bundeslaender_connectivity.geojson") as f:
    data = json.load(f)


def simplifyFeature(feature):
    providerIndex = providers.index(feature["provider"])

    return {
        "type": "Feature",
        "geometry": feature["geometry"],
        "p": [feature["properties"]["stability"],
              feature["properties"]["measurements"],
              providerIndex,
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
