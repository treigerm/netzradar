# What is this?
A visualisation of the "Netzradar" dataset from [DB Open Data](http://data.deutschebahn.com/dataset/data-netzradar).

# Why did I do this?
- Learning how to create simple maps and customise them
- Working with GeoJSON
- Getting familiar with popular JavaScript data visualisation tools

# How can I run this on my computer?
You need:
* Docker installed on your local machine
* A Mapbox API Access Token
In the directory in which you cloned the code run
```
docker build -t netzradar:v1 .
docker create -p 5000:5000 netzradar:v1
docker start [ContainerID]
```
Then you should be able to visit the project on `localhost:5000` in your browser.

## Caveats
My goal with this project was not to develop a responsive website so you might find that the website looks a bit
different on your machine than in the GIFs. The website should work best on a 13'' website with Chrome.
