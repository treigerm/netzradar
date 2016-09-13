# This script is used to clean the "Netzradar" dataset. The dataset provides us with
# the connectivity data of 500m long rail sections. For each section we determine in which
# Bundesland it is in. We also delete every section which has no measurements which drastically
# shrinks our final file size.
import json
from shapely.geometry import Point, shape
from tqdm import tqdm


def get_bundesland(longitude, latitude, bundeslaender):
    """Return the bundesland in which the coordinates are in. If it cannot find the Bundesland it
    raises an exception."""
    point = Point(longitude, latitude)

    for bundesland in bundeslaender["features"]:
        polygon = shape(bundesland["geometry"])
        if polygon.contains(point):
            return bundesland["properties"]["NAME_1"]

    raise ValueError("Position not in a Bundesland")


def make_features(feature):
    """For each given feature create five new features (one for each provider) and only use the
    general connectivity stability values and measurements."""
    providers = ["all", "t-mobile", "vodafone", "e-plus", "o2"]
    features = []

    try:
        # Each feature is a LineString and we use only its first point to determine
        # the bundesland since borderline cases are very rare.
        first_long = feature["geometry"]["coordinates"][0][0]
        first_lat = feature["geometry"]["coordinates"][0][1]
        bundesland = get_bundesland(first_long, first_lat, bundeslaender)
    except:
        # If we cannot determine the Bundesland, skip this feature
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

if __name__ == '__main__':
    # load "Netzradar" data from DB Open Data
    with open("connectivity.geojson") as f:
        data = json.load(f)

    # load geographic borders of Bundeslaender
    with open("bundeslaender.geojson") as f:
        bundeslaender = json.load(f)

    featureCollection = {
        "type": "FeatureCollection",
        "features": []
    }

    for feature in tqdm(data["features"]):
        newFeatures = make_features(feature)
        if newFeatures:
            featureCollection["features"].extend(newFeatures)

    with open("bundeslaender_connectivity.geojson", "w+") as f:
        json.dump(featureCollection, f)
