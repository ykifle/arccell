define(["esri/map", "esri/geometry/Geometry", "esri/geometry/Point", "esri/geometry/Polyline", 
"esri/geometry/Polygon", "esri/graphic", "esri/symbols/SimpleMarkerSymbol", 
"esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", 
"esri/InfoTemplate", "esri/layers/GraphicsLayer", "esri/renderers/SimpleRenderer", 
"arccell/ClusterLayer","esri/symbols/PictureMarkerSymbol","esri/renderers/ClassBreaksRenderer",
"esri/geometry/webMercatorUtils",
"dojo/domReady!", "esri/geometry"], function(
  Map, Geometry, Point, Polyline, 
  Polygon, Graphic, SimpleMarkerSymbol, 
  SimpleLineSymbol, SimpleFillSymbol, Color, 
  InfoTemplate, GraphicsLayer, SimpleRenderer,
  ClusterLayer,PictureMarkerSymbol,ClassBreaksRenderer,
  webMercatorUtils) {

  var map = new Map("map", {
    basemap: "topo",
    center: [-106.61, 35.1107],
    zoom: 5
  });
  var mapLoaded = false;
  var dataCache = {
    '_default': []
  };
  var graphicsLayers = {};
  var allPoints = [];

  map.on("load", initGraphics);

  function initGraphics() {
      mapLoaded = true;
      graphicsLayers['_default'] = map.graphics;
      for (var layerName in dataCache) {
        addPoints(dataCache[layerName], layerName);
      }
  }

  function addPoint(pointData) {
    var mark;
    layerName = layerName || '_default';
    if (!(layerName in graphicsLayers)) {
      console.log('No layer with name ' + layerName);
      return;
    }

    if (!isNaN(parseFloat(pointData.long)) && isFinite(pointData.long)) {
      //if it's a number, then interpret as lat/long
      mark = new Point(pointData.long, pointData.lat);
    } else {
        //if it's not a lat/long, do geocoding
        var xhr = new XMLHttpRequest();
        xhr.open("GET", 
           "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?f=pjson&text="
           +encodeURIComponent(pointData.long),
           false);
        xhr.send();
        if (xhr.status == 200) {
          var geom = JSON.parse(xhr.response).locations[0].feature.geometry;
          mark = new Point(geom.x, geom.y);
        } else {
          app.showNotification('Error:', 'Unable to connect to ESRI Geocode Server.');
          return;
        }
      }
    
    var webMercator = webMercatorUtils.geographicToWebMercator(mark);
    allPoints.push(webMercator);
    var pointSymbol = new SimpleMarkerSymbol();
    var pointAttributes = {
      city: "Albuquerque",
      state: "New Mexico"
    };
    var pointInfoTemplate = new InfoTemplate("Albuquerque");
    var pointGraphic = new Graphic(mark, pointSymbol, pointAttributes).setInfoTemplate(pointInfoTemplate);
    graphicsLayers[layerName].add(pointGraphic);
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

  function addGraphicLayer(name) {
    var layer = new GraphicsLayer();
    var pointSymbol = new SimpleMarkerSymbol();
    var renderer = new SimpleRenderer(pointSymbol);
    layer.setRenderer(renderer);
    map.addLayer(layer);
    graphicsLayers[name] = layer;
  }

  function addClusterLayer(name) {
    var layer = new ClusterLayer({
      "data": allPoints,
      "distance": 100,
      "id": "clusters",
      "labelColor": "#fff",
      "labelOffset": 10,
      "resolution": map.extent.getWidth() / map.width,
            "showSingles": true,
      "singleColor": "#888",
      "maxSingles":10
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
    graphicsLayers[name] = layer;
    }

    function hideLayer(name) {
      graphicsLayers[name].hide();
  }

  function showLayer(name) {
    graphicsLayers[name].show();
  }

  return {
    map: map,
    addPoint: addPoint,
    addPoints: addPoints,
    addGraphicLayer: addGraphicLayer,
    addClusterLayer: addClusterLayer,
    hideLayer: hideLayer,
    showLayer: showLayer
  };

});
