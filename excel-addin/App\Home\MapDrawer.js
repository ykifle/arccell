define(["esri/map",
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
        "dojo/domReady!",
        "esri/geometry"],
  function (Map,
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
            SimpleRenderer) {
    
    var map = new Map("map", {
        basemap: "topo",
        center: [-106.61, 35.1107],
        zoom: 13
    });
    var mapLoaded = false;
    var dataCache = {
      '_default': []
    };
    var graphicsLayers = {};
    
    map.on("load", initGraphics);

    function initGraphics() {
      mapLoaded = true;
      graphicsLayers['_default'] = map.graphics;
      for (var layerName in dataCache) {
        addPoints(dataCache[layerName], layerName);
      }
    }

    function addPoint(pointData, layerName) {
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

      var pointSymbol = new SimpleMarkerSymbol();
      var pointAttributes = { city: "Albuquerque", state: "New Mexico" };
      var pointInfoTemplate = new InfoTemplate("Albuquerque");
      var pointGraphic = new Graphic(mark, pointSymbol, pointAttributes).setInfoTemplate(pointInfoTemplate);
      graphicsLayers[layerName].add(pointGraphic);
    }

    function addPoints(data, layerName) {
      if (mapLoaded) {
        for (var i=0; i < data.length; i++) {
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
  
    function hideLayer(name) {
      graphicsLayers[name].hide();
    }
    
    function showLayer(name) {
      graphicsLayers[name].show();
    }

    return {
      map: map,
      addPoints: addPoints,
      addPoint: addPoint,
      addGraphicLayer: addGraphicLayer,
      hideLayer: hideLayer,
      showLayer: showLayer
    };
});
