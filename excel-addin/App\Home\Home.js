/// <reference path="../App.js" />
// global app
(function() {
	'use strict';

	// The initialize function must be run each time a new page is loaded
	Office.initialize = function(reason) {
		$(document).ready(function() {
			app.initialize();
			require(["arccell/MapDrawer", "arccell/ArcGisApi", "dojo/_base/array", "dojo/domReady!"], function(drawer, arcApi, array) {
				drawer.addGraphicLayer('clickPoints');
				addLayerToggle('clickPoints');
				drawer.map.on("click", doClick);

				function doClick(event) {
					var mp = esri.geometry.webMercatorToGeographic(event.mapPoint);
					drawer.addPoint({
						long: mp.x,
						lat: mp.y
					}, 'clickPoints');
					insertExcelReverseGeoData(mp);
				}

				function addLayerToggle(name) {
					var toggle = $('<input />', {
						type: 'checkbox',
						id: name + '-layer-toggle',
						value: name
					}).attr('checked', 'checked');
					var label = $('<label />', {
						for: name + '-layer-toggle'
					}).text(name).append(toggle);
					var container = $('#layer-toggles');
					label.appendTo(container);
					toggle.change(function() {
						if ($(this).is(":checked")) {
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
					
					function handleBaseClick() {
						drawer.switchBaseMap()
					}
					
					function handleClusterClick() {
						if (drawer.addClusterLayer("clusterPoints")) {
						  addLayerToggle("clusterPoints");
						}
					}
					
					function handleHeatmapClick() {
						if (drawer.addHeatmapLayer("heatmapPoints")) {
						  addLayerToggle("heatmapPoints");
						}
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
				
				function handleGeoEnrichClick() {
					getDataFromSelection(function(result) {
						var points = [];
						for (var idx = 0; idx < result.value.length; ++idx) {
							points.push({
								long: result.value[idx][0],
								lat: result.value[idx][1]
							});
						}
						arcApi.getGeoEnrichmentData(points, function(data) {
							console.log('got data');
							if ('messages' in data && data.messages.length) {
								console.log(JSON.stringify(data['messages']));
							}
							if (data.results[0].value.FeatureSet.length === 0) {
								console.log('No features found');
								return;
							}
							var features = data.results[0].value.FeatureSet[0].features;
							var rows = [];
							for (var i=0; i<points.length; i++) {
								var row = [points[i].long, points[i].lat];
								for (var j=0; j < features.length; j++) {
									var attributes = features[j].attributes;
									if (attributes.OBJECTID === i) {
										row.push(attributes.TOTPOP);
									}
								}
								if (row.length == 2) {
									row.push('NA');
								}
								rows.push(row);
							}
							Office.context.document.setSelectedDataAsync(rows);
						});
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
					$.get("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=pjson&location=" + point.x + "," + point.y, function(data) {
						var addr = '';
						var json = JSON.parse(data);
						if (!('error' in json)) {
							addr = json.address.Match_addr;
						}
						Office.context.document.setSelectedDataAsync([
							[point.x, point.y, addr]
						]);
					});
				}

				/******* Helpers *******/

				function generateRandomGeoList(count) {
					var randomData = [];
					// var ps = []
					for (var i = 0; i < count; ++i) {
						randomData.push({
							long: randomGeo()-95,
							lat: randomGeo()+37
						});
					}
					return randomData;
				}

				function randomGeo() {
					return (Math.random() * 40-20).toFixed(3) * 1;
				}

					$('#base').click(handleBaseClick);
					$('#show-data').click(function(){showDataFromSelection('clickPoints')});
					$('#generate-data').click(function() { showRandomData('clickPoints'); });
					$('#cluster').click(handleClusterClick);
					$('#heatmap').click(handleHeatmapClick);
					$('#enrich').click(handleGeoEnrichClick);
			  }
			);
		});
	};
})();