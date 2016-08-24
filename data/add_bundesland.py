import json
from shapely.geometry import Point, shape
from tqdm import tqdm


def get_bundesland(longitude, latitude, bundeslaender):
    point = Point(longitude, latitude)

    for bundesland in bundeslaender["features"]:
        polygon = shape(bundesland["geometry"])
        if polygon.contains(point):
            return bundesland["properties"]["NAME_1"]

    return "other"


def make_features(feature):
    providers = ["all", "t-mobile", "vodafone", "e-plus", "o2"]
    features = []

    try:
        first_long = feature["geometry"]["coordinates"][0][0]
        first_lat = feature["geometry"]["coordinates"][0][1]
        bundesland = get_bundesland(first_long, first_lat, bundeslaender)
    except:
        # exit if we cannot determine bundesland
        return

    for provider in providers:
        stability = feature["properties"][provider + "_stability"]
        measurements = feature["properties"][provider + "_measurements"]

        if measurements == 0:
            continue

        features.append({
            "type": feature["type"],
            "geometry": feature["geometry"],
            "properties": {"stability": stability, "measurements": measurements},
            "provider": provider,
            "bundesland": bundesland
        })

    return features

with open("connectivity.geojson") as f:
    data = json.load(f)

with open("bundeslaender.geojson") as f:
    bundeslaender = json.load(f)

featureCollection = {
    "type": "FeatureCollection",
    "features": []
}

for feature in tqdm(data["features"]):
    newFeatures = make_features(feature)
    featureCollection["features"].extend(newFeatures)


with open("bundeslaender_connectivity.geojson", "w+") as f:
    json.dump(featureCollection, f)

# TODO: Transform decimals into percent values

# Total number of measurements: 1746092
