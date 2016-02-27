/// <reference path="../App.js" />
// global app
(function() {
	'use strict';
	var map;
	var addPoints;

	// The initialize function must be run each time a new page is loaded
	Office.initialize = function(reason) {
		$(document).ready(function() {
			app.initialize();
			require(
				["esri/map", "esri/geometry/Geometry", "esri/geometry/Point", "esri/geometry/Polyline",
				 "esri/geometry/Polygon", "esri/graphic", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/InfoTemplate", "dojo/domReady!", "esri/geometry"], 
			function(Map, Geometry, Point, Polyline, Polygon, Graphic, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, InfoTemplate) {
				map = new Map("map", {
					basemap: "topo",
					center: [-106.61, 35.1107],
					zoom: 13
				});
				var mapLoaded = false;
				var dataCache = [];

				map.on("load", addSomeGraphics);
				map.on("click", doClick);

				function addSomeGraphics() {
					mapLoaded = true;
					if (dataCache) {
						addPoints(dataCache);
					}
				}
			    
			    function doClick(event) {
				var mp = esri.geometry.webMercatorToGeographic(event.mapPoint);
				addPoints([{long: mp.x, lat: mp.y}]);
				addData(mp);
			    }

				addPoints = function(data) {
					if (mapLoaded) {
						for (var i = 0; i < data.length; i++) {
							var pointDat = data[i];
							var mark = new Point(pointDat.long, pointDat.lat);
							var pointSymbol = new SimpleMarkerSymbol();
							var pointAttributes = {
								city: "Albuquerque",
								state: "New Mexico"
							};
							var pointInfoTemplate = new InfoTemplate("Albuquerque");
							var pointGraphic = new Graphic(mark, pointSymbol, pointAttributes).setInfoTemplate(pointInfoTemplate);
							map.graphics.add(pointGraphic);
						}
					} else {
						dataCache = dataCache.concat(data);
					}
				};


			});
			$('#show-data-from-selection').click(showDataFromSelection);
		});
	};

	// Reads data from current document selection and displays a notification
	function showDataFromSelection() {
		if (Office.context.document.getSelectedDataAsync) {
			Office.context.document.getSelectedDataAsync(Office.CoercionType.Matrix, function(result) {
				if (result.status === Office.AsyncResultStatus.Succeeded) {
					addPoints([{long: -106.61,lat: 35.1107}]);
					for (var idx=0;idx<result.value.length;++idx) {
					  addPoints([{long: result.value[idx][0],lat: result.value[idx][1]}]);
					}
					app.showNotification('Drawn on ESRI map', result.value.length+" points");
				} else {
					app.showNotification('Error:', result.error.message);
				}
			});
		} else {
			app.showNotification('Error:', 'Reading selection data is not supported by this host application.');
		}
	}
    
    function addData(point) {
	Office.context.document.setSelectedDataAsync([[point.x, point.y]]);
	Office.context.document.goToByIdAsync(Office.Index.Next,Office.GoToType.Index);
    }

})();
