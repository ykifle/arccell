﻿/// <reference path="../App.js" />
// global app
(function() {
	'use strict';

	// The initialize function must be run each time a new page is loaded
	Office.initialize = function(reason) {
		$(document).ready(function() {
			app.initialize();
			require([
			  "arccell/MapDrawer",
			  "dojo/domReady!"],
			  function(drawer) {
			    drawer.map.on("click", doClick);

			    function doClick(event) {
			      var mp = esri.geometry.webMercatorToGeographic(event.mapPoint);
			      drawer.addPoints([{long: mp.x, lat: mp.y}]);
			      addData(mp);
			    }
			  }
			);
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
	var xhr = new XMLHttpRequest();
	xhr.open("GET", 
		 "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=pjson&location="
		 +point.x+","+point.y,
		 false);
	xhr.send();
	var addr = "";
	if (xhr.status == 200) {
	    addr = JSON.parse(xhr.response).address.Match_addr;
	}
	Office.context.document.setSelectedDataAsync([[point.x, point.y, addr]]);
    }

})();
