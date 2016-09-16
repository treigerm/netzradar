# What is this?
A visualisation of the "Netzradar" dataset from [DB Open Data](http://data.deutschebahn.com/dataset/data-netzradar). It contains data about the stability of the internet connection on the German rail network for popular German mobile service providers.

# Why did I do this?
In a broader sense I am currently trying to get into Data Science and Machine Learning so data visualisation was a natural first step. Moreover, I am really interested in the analysis of geospatial data and always in search for public data sets to work with. In summary, this project allowed me to get familiar with popular JavaScript data visualisation tools, namely DC.js and crossfilter.js, work with GeoJSON and learn how to create simple maps and customise them.

# How can I run this on my computer?
You need:
* Docker installed on your local machine ([Install Docker](https://docs.docker.com/engine/installation/))
* A Mapbox API Access Token ([Mapbox Sign up](https://www.mapbox.com/studio/signup/))
First, clone this repository into a directory of you choice:
```
git clone https://github.com/treigerm/netzradar.git
```
In the first line of the file `static/js/graphs.js` insert your Mapbox API token for the placeholder:
```
var mapboxAccessToken = "[accessToken]";
```
In the directory in which you cloned the code run:
```
docker build -t netzradar:v1 .
docker create -p 5000:5000 netzradar:v1
docker start [ContainerID]
```
Then you should be able to visit the project on `localhost:5000` in your browser.

## Caveats
My goal with this project was not to develop a responsive website so you might find that the website looks a bit different on your machine than in the GIFs. The website should work best on a 13 inch monitor with Chrome.
