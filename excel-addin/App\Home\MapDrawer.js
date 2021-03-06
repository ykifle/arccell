﻿define(["esri/map",
        "esri/geometry/Geometry",
        "esri/geometry/Point",
        "esri/geometry/Polyline",
        "esri/geometry/Polygon",
        "esri/graphic",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/Color",
        "esri/InfoTemplate",
        "esri/layers/GraphicsLayer",
        "esri/renderers/SimpleRenderer",
        "arccell/ClusterLayer",
        "arccell/HeatmapLayer",
        "esri/symbols/PictureMarkerSymbol",
        "esri/renderers/ClassBreaksRenderer",
        "esri/geometry/webMercatorUtils",
        "arccell/ArcGisApi",
        "arccell/Heatmap",
        "dojo/domReady!",
        "esri/geometry"], function(Map,
                                   Geometry,
                                   Point,
                                   Polyline,
                                   Polygon,
                                   Graphic,
                                   SimpleMarkerSymbol,
                                   SimpleLineSymbol,
                                   SimpleFillSymbol,
                                   Color,
                                   InfoTemplate,
                                   GraphicsLayer,
                                   SimpleRenderer,
                                   ClusterLayer,
                                   HeatmapLayer,
                                   PictureMarkerSymbol,
                                   ClassBreaksRenderer,
                                   webMercatorUtils,
                                   arcApi) {

  var map = new Map("map", {
    basemap: "topo",
    center: [-80.61, 40.1107],
    zoom: 5
  });
  var mapLoaded = false;
  var dataCache = {
    '_default': []
  };
  var allLayers = {};
  var allPoints = [];
  var heatData = [];
  var baseIdx = 0;

  map.on("load", initGraphics);
  
  var bases = [
    "streets" , "satellite", "hybrid" ,"topo", "gray" ,"dark-gray", 
    "oceans", "national-geographic", "terrain" ,"osm"]
  function switchBaseMap(){
    ++baseIdx;
    map.setBasemap(bases[baseIdx%10])
  }

  function initGraphics() {
    mapLoaded = true;
    allLayers['_default'] = map.graphics;
    for (var layerName in dataCache) {
      addPoints(dataCache[layerName], layerName);
    }
  }

  function addPoint(pointData, layerName) {
    var mark;
    layerName = layerName || '_default';
    if (!(layerName in allLayers)) {
      console.log('No layer with name ' + layerName);
      return;
    }

    if (!isNaN(parseFloat(pointData.long)) && isFinite(pointData.long)) {
      //if it's a number, then interpret as lat/long
      mark = new Point(pointData.long, pointData.lat);
    } else {
      //if it's not a lat/long, do geocoding
      mark = arcApi.geocode(pointData.long);
    }

    var webMercator = webMercatorUtils.geographicToWebMercator(mark);
    allPoints.push(webMercator);
    heatData.push({
      'attributes': {},
      'geometry': {
        spatialReference: {
          wkid: 102100
        },
        type: "point",
        x: webMercator.x,
        y: webMercator.y
      }
    })
    var pointSymbol = new SimpleMarkerSymbol();
    var pointAttributes = {
      city: "Albuquerque",
      state: "New Mexico"
    };
    var pointInfoTemplate = new InfoTemplate("Albuquerque");
    var pointGraphic = new Graphic(mark, pointSymbol, pointAttributes).setInfoTemplate(pointInfoTemplate);
    allLayers[layerName].add(pointGraphic);
  }

  function addPoints(data, layerName) {
    if (mapLoaded) {
      for (var i = 0; i < data.length; i++) {
        addPoint(data[i], layerName);
      }
    } else {
      layerName = layerName || '_default';
      if (!(layerName in dataCache)) {
        dataCache[layerName] = [];
      }
      dataCache[layerName] = dataCache[layerName].concat(data);
    }
  }
  
  function clearPoints(layerName) {
    allLayers[layerName].clear();
  }

  function addGraphicLayer(name) {
    var layer = new GraphicsLayer();
    var pointSymbol = new SimpleMarkerSymbol();
    var renderer = new SimpleRenderer(pointSymbol);
    layer.setRenderer(renderer);
    map.addLayer(layer);
    allLayers[name] = layer;
  }

  function addClusterLayer(name) {
    var add = true
    if (name in allLayers) {
      add = false
      map.removeLayer(allLayers[name])
    }
    var layer = new ClusterLayer({
      "data": allPoints,
      "distance": 100,
      "id": "clusters",
      "labelColor": "#fff",
      "labelOffset": 10,
      "resolution": map.extent.getWidth() / map.width,
      "showSingles": true,
      "singleColor": "#888",
      "maxSingles": 10
    });
    var pointSymbol = new SimpleMarkerSymbol().setSize(4);
    var renderer = new ClassBreaksRenderer(pointSymbol, "clusterCount");
    var picBaseUrl = "https://static.arcgis.com/images/Symbols/Shapes/";
    var blue = new PictureMarkerSymbol(picBaseUrl + "BluePin1LargeB.png", 32, 32).setOffset(0, 15);
    var green = new PictureMarkerSymbol(picBaseUrl + "GreenPin1LargeB.png", 64, 64).setOffset(0, 15);
    var red = new PictureMarkerSymbol(picBaseUrl + "RedPin1LargeB.png", 72, 72).setOffset(0, 15);
    renderer.addBreak(0, 1, blue);
    renderer.addBreak(1, 5, green);
    renderer.addBreak(5, 1001, red);
    layer.setRenderer(renderer);
    map.addLayer(layer);
    allLayers[name] = layer;
    return add;
  }

  function addHeatmapLayer(name) {
    if (!(name in allLayers)) {
      layer = new HeatmapLayer({
        config: {
          "useLocalMaximum": true,
          "radius": 40,
          "gradient": {
            0.25: "rgb(000,000,255)",
            0.45: "rgb(000,255,255)",
            0.65: "rgb(000,255,000)",
            0.85: "rgb(255,255,000)",
            1.00: "rgb(255,000,000)"
          }
        },
        "map": map,
        "domNodeId": "heatLayer",
        "opacity": 0.8,
    "className": "heatmap"
      });
      layer.setData(heatData);
      map.addLayer(layer);
      allLayers[name] = layer;
      return true;
    } else {
      refreshHeatmapLayer(name);
      return false;
    }
  }
  
  function hasLayer(name) {
    return name in allLayers;
  }

  function refreshHeatmapLayer(name) {
    allLayers[name].setData(heatData);
  }

  function hideLayer(name) {
    allLayers[name].hide();
  }

  function showLayer(name) {
    allLayers[name].show();
  }

  function clearLayers() {
    for (var name in allLayers) {
    if (allLayers[name].className=="heatmap") {
      map.removeLayer(allLayers[name])
    }
    else allLayers[name].clear();
  }
  }

  return {
    map: map,
    addPoint: addPoint,
    addPoints: addPoints,
  clearPoints: clearPoints,
    addGraphicLayer: addGraphicLayer,
    addClusterLayer: addClusterLayer,
    addHeatmapLayer: addHeatmapLayer,
    hideLayer: hideLayer,
    showLayer: showLayer,
    switchBaseMap: switchBaseMap,
    clearLayers: clearLayers,
  hasLayer: hasLayer
  };

});
