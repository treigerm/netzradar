from flask import Flask
from flask import render_template

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/data")
def data():
    with open("data/bundeslaender_connectivity.geojson", "r") as f:
        return f.read()

if __name__ == "__main__":
    app.run()
