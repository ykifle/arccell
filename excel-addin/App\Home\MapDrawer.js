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
            InfoTemplate) {
    
    var map = new Map("map", {
        basemap: "topo",
        center: [-106.61, 35.1107],
        zoom: 13
    });
    var mapLoaded = false;
    var dataCache = [];
    
    map.on("load", initGraphics);

    function initGraphics() {
      mapLoaded = true;
      if (dataCache) {
        addPoints(dataCache);
      }
    }

      function addPoint(pointData) {
          var mark;
	  if (!isNaN(parseFloat(pointDat.long)) && isFinite(pointDat.long)) {
              //if it's a number, then interpret as lat/long
	      mark = new Point(pointDat.long, pointDat.lat);
	  }
	  else {
	      //if it's not a lat/long, do geocoding
	      var xhr = new XMLHttpRequest();
	      xhr.open("GET", 
		       "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?f=pjson&text="
		       +encodeURIComponent(pointDat.long),
		       false);
	      xhr.send();
	      if (xhr.status == 200) {
		  var geom = JSON.parse(xhr.response).locations[0].feature.geometry;
		  mark = new Point(geom.x, geom.y);
	      } else {
		  app.showNotification('Error:', 'Unable to connect to ESRI Geocode Server.');
                  return;
	      }
      var pointSymbol = new SimpleMarkerSymbol();
      var pointAttributes = { city: "Albuquerque", state: "New Mexico" };
      var pointInfoTemplate = new InfoTemplate("Albuquerque");
      var pointGraphic = new Graphic(mark, pointSymbol, pointAttributes).setInfoTemplate(pointInfoTemplate);
      map.graphics.add(pointGraphic);
    }

    function addPoints(data) {
      if (mapLoaded) {
        for (var i=0; i < data.length; i++) {
          addPoint(data[i]);
        }
      } else {
        dataCache = dataCache.concat(data);
      }
    };

    return {
      map: map,
      addPoints: addPoints
    };
});
