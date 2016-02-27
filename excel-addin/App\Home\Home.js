/// <reference path="../App.js" />
// global app
(function() {
	'use strict';

	// The initialize function must be run each time a new page is loaded
	Office.initialize = function(reason) {
		$(document).ready(function() {
			app.initialize();
			require([
			  "arccell/MapDrawer",
			  "dojo/_base/array",
			  "dojo/domReady!"],
			  function(drawer, array) {
					addLayerWithToggle('clickPoints');
			    drawer.map.on("click", doClick);

			    function doClick(event) {
			      var mp = esri.geometry.webMercatorToGeographic(event.mapPoint);
			      drawer.addPoint({long: mp.x, lat: mp.y}, 'clickPoints');
			      insertExcelReverseGeoData(mp);
			    }
				
					function addLayerWithToggle(name) {
						drawer.addGraphicLayer(name);
						var toggle = $('<input />', { type: 'checkbox', id: name+'-layer-toggle', value: name })
								.attr('checked', 'checked');
						var label = $('<label />', { for: name+'-layer-toggle' }).text(name).append(toggle);
						var container = $('#layer-toggles');
						label.appendTo(container);
						toggle.change(function() {
					        if($(this).is(":checked")) {
								drawer.showLayer(name);
					        } else {
								drawer.hideLayer(name);
							}
						});
					}

					// Reads data from current document selection and displays a notification
					function showDataFromSelection(layerName) {
						getDataFromSelection(function(result) {
							var points = [];
							for (var idx = 0; idx < result.value.length; ++idx) {
								points.push({
									long: result.value[idx][0],
									lat: result.value[idx][1]
								});
								drawer.addPoints(points, layerName);
							}
						});
					}

					function showRandomData(layerName) {
						getSelectedRowsCount(function(count) {
							var randomPoints = generateRandomGeoList(count);
							var excelRows = array.map(randomPoints, function(p) {
								return [p.long, p.lat];
							});
							drawer.addPoints(randomPoints, layerName);
							Office.context.document.setSelectedDataAsync(excelRows);
						});
					}

					/******* Excel Sheet Manipulation Methods *******/

					function getDataFromSelection(callback) {
						if (Office.context.document.getSelectedDataAsync) {
							Office.context.document.getSelectedDataAsync(Office.CoercionType.Matrix, function(result) {
								if (result.status === Office.AsyncResultStatus.Succeeded) {
									if (callback) {
										callback(result);
									}
									app.showNotification('Drawn on ESRI map', result.value.length + " points");
								} else {
									app.showNotification('Error:', result.error.message);
								}
							});
						} else {
							app.showNotification('Error:', 'Reading selection data is not supported by this host application.');
						}
					}

					function getSelectedRowsCount(callback) {
						getDataFromSelection(function(result) {
							callback(result.value.length);
						});
					}

				  function insertExcelReverseGeoData(point) {
				  	$.get("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=pjson&location=" +
				  		point.x + "," + point.y, function(data) {
				  			var addr = JSON.parse(data).address.Match_addr;
				  			Office.context.document.setSelectedDataAsync([[point.x, point.y, addr]]);
						});
				  }

				  /******* Helpers *******/

				  function generateRandomGeoList(count) {
						var randomData = [];
						// var ps = []
						for (var i = 0; i < count; ++i) {
							randomData.push({
								long: randomGeo(),
								lat: randomGeo()
							});
						}
						return randomData;
					}

					function randomGeo() {
						return (Math.random() * 360 - 180).toFixed(3) * 1;
					}

					$('#show-data-from-selection').click(showDataFromSelection);
					$('#generate-data').click(showRandomData);

			  }
			);
		});
	};
})();
