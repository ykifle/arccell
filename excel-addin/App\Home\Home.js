/// <reference path="../App.js" />
// global app
(function() {
	'use strict';
	var demoData = [
		["Name", "SerialNbr", "ListYear", "DateRecorded", "AssessedValue", "SalePrice", "AdditionalRemarks", "SalesRatio", "NonUseCode", "ResidentialUnits", "Address", "Location", "ResidentialType"],
		["Wilton", 11245, 2011, "05/23/2011", 552090.00, 591500.00, 0, 0.93337278, 25, 1, "25 BUCKINGHAM RIDGE RD", "25 BUCKINGHAM RIDGE RD Wilton, CT", 1],
		["Guilford", 110276, 2011, "08/23/2011", 208800.00, 265000.00, 0, 0.78792453, 14, 1, "5 ROSEMARY LN", "5 ROSEMARY LN Guilford, CT", 1],
		["Tolland", 120001, 2012, "10/01/2011", 205495.00, 336000.00, 0, 0.61159226, 28, 1, "1235 TOLLAND STAGE ROAD", "1235 TOLLAND STAGE ROAD Tolland, CT", 1],
		["Bridgeport", 110038, 2011, "10/01/2011", 2182650.00, 72500.00, "", 30.1055172, 25, 0, "20 HADDON ST UNIT 2", "20 HADDON ST UNIT 2 Bridgeport, CT", 3],
		["Wallingford", 110005, 2011, "10/02/2011", 207600.00, 280000.00, "", 0.74142857, "", 1, "5 LORI LANE", "5 LORI LANE Wallingford, CT", 1],
		["West Haven", 110010, 2011, "10/02/2011", 143500.00, 154900.00, "", 0.92640413, 14, 1, "44 PHILLIPS TERR", "44 PHILLIPS TERR West Haven, CT", 1],
		["Farmington", 110001, 2011, "10/02/2011", 254610.00, 350000.00, "", 0.72745714, "", 1, "42 HIGHWOOD RD", "42 HIGHWOOD RD Farmington, CT", 1],
		["Monroe", 11002, 2011, "10/02/2011", 251370.00, 313700.00, "", 0.80130698, 25, 1, "45 TWIN BROOK TER", "45 TWIN BROOK TER Monroe, CT", 1],
		["New Haven", 110002, 2011, "10/03/2011", 82740.00, 80000.00, "", 1.03425, "", 1, "571 B WOODWARD AVENUE", "571 B WOODWARD AVENUE New Haven, CT", "C"],
		["New Haven", 110001, 2011, "10/03/2011", 118090.00, 164900.00, "", 0.71613099, 7, 1, "1541 ELLA T GRASSO BLVD", "1541 ELLA T GRASSO BLVD New Haven, CT", 3],
		["Southington", 110007, 2011, "10/03/2011", 83510.00, 475262.00, "", 0.17571361, 7, 0, "43 PORRIELLO DR", "43 PORRIELLO DR Southington, CT", 3],
		["Fairfield", 11008, 2011, "10/03/2011", 274050.00, 180000.00, "", 1.5225, 14, 1, "155 SAWYER ROAD", "155 SAWYER ROAD Fairfield, CT", 1],
		["Danbury", 110005, 2011, "10/03/2011", 202500.00, 120000.00, "", 1.6875, 25, 1, "28 GRAND ST", "28 GRAND ST Danbury, CT", 1],
		["Stamford", 110008, 2011, "10/03/2011", 226750.00, 235000.00, "", 0.96489362, "", 1, "180 GLENBROOK ROAD # 6", "180 GLENBROOK ROAD # 6 Stamford, CT", "C"],
		["Danbury", 110004, 2011, "10/03/2011", 150200.00, 145000.00, "", 1.03586207, "", 1, "26 HOLLEY ST", "26 HOLLEY ST Danbury, CT", 1],
		["Westport", 110001, 2011, "10/03/2011", 1279400.00, 2656455.00, 0, 0.4816193, 7, 1, "9 BURRITTS LNDG N", "9 BURRITTS LNDG N Westport, CT", 1],
		["Darien", 11004, 2011, "10/03/2011", 529550.00, 500000.00, "", 1.0591, "", 1, "145 OLD KINGS HIGHWAY SOUTH", "145 OLD KINGS HIGHWAY SOUTH Darien, CT", 1],
		["New London", 110003, 2011, "10/03/2011", 134750.00, 175500.00, "", 0.76780627, "", 1, "25 MORAN ST", "25 MORAN ST New London, CT", 1],
		["Winchester", 110002, 2011, "10/03/2011", 101150.00, 135000.00, "", 0.74925926, "", 1, "111 TORRINGFORD ST UNIT 18", "111 TORRINGFORD ST UNIT 18 Winchester, CT", "C"]
	];

	// The initialize function must be run each time a new page is loaded
	Office.initialize = function(reason) {
		$(document).ready(function() {
			app.initialize();
			require(["arccell/BarChart", "arccell/MapDrawer", "arccell/ArcGisApi", "esri/dijit/geoenrichment/DataBrowser", "dojo/_base/array", "dojo/domReady!"], function(chart, drawer, arcApi, DataBrowser, array) {
				drawer.addGraphicLayer('clickPoints');
				addLayerToggle('clickPoints');

				//drawer.map.on("click", doClick);
				setSelectedDataAsync(demoData);

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

				function handleHightlightSelectionChange() {
					if ($(this).is(":checked")) {
						Office.context.document.addHandlerAsync(
						Office.EventType.DocumentSelectionChanged, documentSelectionChangedHandler, function(asyncResult) {
							if (asyncResult.status == "failed") {
								console.log("Action failed with error: " + asyncResult.error.message);
							} else {
								console.log("DocumentSelectionChanged handler added successfully." + " Click Next to learn how to remove it.");
							}
						});
					} else {
						Office.context.document.removeHandlerAsync(
						Office.EventType.DocumentSelectionChanged, {
							handler: documentSelectionChangedHandler
						}, function(asyncResult) {
							if (asyncResult.status == "failed") {
								console.log("Action failed with error: " + asyncResult.error.message);
							} else {
								console.log("DocumentSelectionChanged handler remove succeeded");
							}
						});
					}
				}

				function documentSelectionChangedHandler(args) {
					getDataFromSelection(function(asyncResult) {
						console.log("DocumentSelectionChanged: " + asyncResult.value);
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
						}
						drawer.addPoints(points, layerName);
					});
				}

				function handleBaseClick() {
					drawer.switchBaseMap()
				}

				function handleClusterClick() {
					if (drawer.addClusterLayer("clusterPoints")) {
						addLayerToggle("clusterPoints");
						$('#clickPoints-layer-toggle').removeAttr('checked').trigger("change");
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
						setSelectedDataAsync(excelRows);
					});
				}

				function handleGeoEnrichClick() {
					getDataFromSelection(function(result) {
						var matrix = result.value;
						var outputColumnsCount = matrix[0].length;
						var dataInputStartColumn = 0;
						var virtualMatrix = matrix;
						for (; dataInputStartColumn < outputColumnsCount; dataInputStartColumn++) {
							if (matrix[0][dataInputStartColumn].length === 0) {
								break;
							}
						}
						if (dataInputStartColumn >= outputColumnsCount) {
							console.log('Please select both the data column and the empty columns to populate');
							return;
						} else if (!(/^\d+\.?\d*$/.test(result.value[0][0]))) {
							virtualMatrix = result.value.map(function(row) {
								var coord = arcApi.geocode(row[0]);
								return [coord.x, coord.y].concat(row.slice(1));
							});
						}
						var points = virtualMatrix.map(function(row) {
							return {
								long: row[0],
								lat: row[1]
							};
						});
						if ($('#dataBrowser').length === 0) {
							$('<div />', {
								id: 'dataBrowser'
							}).appendTo($('.dataBrowserPopup'))
						}
						var dataBrowser = new DataBrowser({
							countryID: "US",
							selectionLimit: 10,
							okButton: "Enhance",
							backButton: "Back",
							cancelButton: "Close",
							onSelect: function() {
								console.log("Selected variables: " + dataBrowser.get("selection"));
							},
							onOK: function() {
								var selectedVariables = dataBrowser.get("selection");
								$('.dataBrowserPopup').removeClass('open');
								dataBrowser.destroy();
								console.log("OK clicked");
								if (selectedVariables.length === 0) {
									return;
								}
								arcApi.getGeoEnrichmentData(points, {
									analysisVariables: selectedVariables
								}, function(data) {
									console.log('got data');
									if ('messages' in data && data.messages.length) {
										console.log(JSON.stringify(data['messages']));
									}
									if (data.results[0].value.FeatureSet.length === 0) {
										console.log('No features found');
										return;
									}
									var features = data.results[0].value.FeatureSet[0].features;
									var featuresMap = {};
									features.forEach(function(feature) {
										featuresMap[feature.attributes.OBJECTID - 1] = feature.attributes;
									});
									var rows = [];
									for (var i = 0; i < matrix.length; i++) {
										var row = matrix[i].slice(0, dataInputStartColumn);
										if (i in featuresMap) {
											selectedVariables.forEach(function(selectedVariable) {
												var normalSelectedVariable = selectedVariable;
												if (selectedVariable.indexOf('.') >= 0) {
													normalSelectedVariable = selectedVariable.split('.')[1];
												}
												if (normalSelectedVariable in featuresMap[i]) {
													row.push(featuresMap[i][normalSelectedVariable]);
												} else {
													row.push('NA');
												}
											});
										} else {
											selectedVariables.forEach(function(selectedVariable) {
												row.push('NA');
											});
										}
										rows.push(row);
									}
									// normalize rows
									for (var j = 0; j < rows.length; j++) {
										if (rows[j].length > outputColumnsCount) {
											rows[j] = rows[j].slice(0, outputColumnsCount);
										} else if (rows[j].length < outputColumnsCount) {
											for (var k = 0; k < outputColumnsCount - rows[j].length; k++) {
												rows[j].push('');
											}
										}
									}
									setSelectedDataAsync(rows);
								});
							},
							onCancel: function() {
								$('.dataBrowserPopup').removeClass('open');
								dataBrowser.destroy();
								console.log("Cancel clicked");
							},
							onBack: function() {
								console.log("Back clicked");
							}
						}, "dataBrowser");
						arcApi.login(function() {
							$('.dataBrowserPopup').addClass('open');
							dataBrowser.startup();
						});
					});
				}

				function handleClearClick() {
					drawer.clearLayers();
				}

				/******* Excel Sheet Manipulation Methods *******/

				function getDataFromSelection(coercionType, callback) {
					if (typeof coercionType == 'function' && !callback) {
						callback = coercionType;
						coercionType = Office.CoercionType.Matrix;
					}
					if (Office.context.document.getSelectedDataAsync) {
						Office.context.document.getSelectedDataAsync(coercionType, function(result) {
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

				function plotData() {
					getDataFromSelection(function(result) {
						//							if (result.value[0].length == 1) {
						//								Office.context.document.bindings.addFromSelectionAsync(Office.BindingType.Table, {
						//									id: 
						//								})
						//								Office.context.document.bindings.addFromPromptAsync(Office.BindingType.Matrix, {
						//									id: 'MyBinding',
						//									promptText: 'Select Data to plot.' }, function (asyncResult) {
						//							        console.log('Added new binding with type: ' + asyncResult.value.type + ' and id: ' + asyncResult.value.id);
						//							    });
						//							} else 
						if (result.value[0].length == 2) {
							if (!drawer.hasLayer('chartPoints')) {
								drawer.addGraphicLayer('chartPoints');
								addLayerToggle('chartPoints');
							}
							var gc = result.value.map(

							function(d) {
								var p = arcApi.geocode(d[0]);
								return [p.x, p.y, d[1]];
							});
							var data = chart.count(gc);
							chart.chart(data);
							$('#clickPoints-layer-toggle').removeAttr('checked').trigger("change");
							$('#clusterPoints-layer-toggle').removeAttr('checked').trigger("change");
							$('#heatmapPoints-layer-toggle').removeAttr('checked').trigger("change");
						} else if (result.value[0].length == 3) {
							var data = chart.count(result.value);
							if (!drawer.hasLayer('chartPoints')) {
								drawer.addGraphicLayer('chartPoints');
								addLayerToggle('chartPoints');
							}
							chart.chart(data);
							$('#clickPoints-layer-toggle').removeAttr('checked').trigger("change");
							$('#clusterPoints-layer-toggle').removeAttr('checked').trigger("change");
							$('#heatmapPoints-layer-toggle').removeAttr('checked').trigger("change");
						} else {
							app.showNotification('Error:', 'Select 2 or 3 columns to chart.');
						}
					});
				}

				/******* Helpers *******/
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
						setSelectedDataAsync([
							[point.x, point.y, addr]
						]);
					});
				}

				function setSelectedDataAsync(data, options) {
					options = options || {};
					Office.context.document.setSelectedDataAsync(data, options, function(asyncResult) {
						if (asyncResult.status == "failed") {
							console.log("Action failed with error: " + asyncResult.error.message);
						} else {
							console.log("Table successfully written. Click next to move on.");
						}
					});
				}

				/******* Helpers *******/

				function generateRandomGeoList(count) {
					var randomData = [];
					// var ps = []
					for (var i = 0; i < count; ++i) {
						randomData.push({
							long: randomGeo() - 95,
							lat: randomGeo() + 37
						});
					}
					return randomData;
				}

				function randomGeo() {
					return (Math.random() * 40 - 20).toFixed(3) * 1;
				}

				$('#base').click(handleBaseClick);
				$('#show-data').click(function() {
					showDataFromSelection('clickPoints')
				});
				//					$('#generate-data').click(function() {
				//						showRandomData('clickPoints');
				//					});
				$('#cluster').click(handleClusterClick);
				$('#heatmap').click(handleHeatmapClick);
				$('#enrich').click(handleGeoEnrichClick);
				//$('#highlight-selection').change(handleHightlightSelectionChange);
				$('#make-chart').click(plotData);
				$('#clear').click(handleClearClick);
			});
		});
	};
})();