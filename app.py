from shapely.geometry import Point, shape

from flask import Flask
from flask import render_template
import json

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/data")
def data():
    with open("data/connectivity.geojson") as f:
        data = json.load(f)

    with open("data/bundeslaender.geojson") as f:
        bundeslaender = json.load(f)

    for feature in data["features"][:500]:
        try:
            first_long, first_lat = feature["geometry"]["coordinates"][0][0], feature["geometry"]["coordinates"][0][1]
            feature["bundesland"] = get_bundesland(first_long, first_lat, bundeslaender)
        except:
            feature["bundesland"] = "other"

    return json.dumps(data["features"])


def get_bundesland(longitude, latitude, bundeslaender):
    point = Point(longitude, latitude)
    for bundesland in bundeslaender["features"]:
        polygon = shape(bundesland["geometry"])
        if polygon.contains(point):
            return bundesland["properties"]["NAME_1"]
    return "other"

if __name__ == "__main__":
    app.run()
