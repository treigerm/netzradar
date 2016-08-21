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

with open("connectivity.geojson") as f:
    data = json.load(f)

with open("bundeslaender.geojson") as f:
    bundeslaender = json.load(f)

for feature in tqdm(data["features"]):
    try:
        first_long, first_lat = feature["geometry"]["coordinates"][0][0], feature["geometry"]["coordinates"][0][1]
        feature["bundesland"] = get_bundesland(first_long, first_lat, bundeslaender)
    except:
        feature["bundesland"] = "other"


with open("bundeslaender_connectivity.geojson", "w+") as f:
    json.dump(data, f)

# TODO: Transform decimals into percent values
