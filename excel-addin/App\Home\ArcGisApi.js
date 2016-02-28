define(["esri/geometry/Point",
"esri/request",
    "esri/IdentityManager",
    "esri/ServerInfo",
    "dojo/_base/array"], function(Point, esriRequest, esriId, ServerInfo, arrays) {

  var apiKey;
  var keyExpires;
  var username = 'ykifle';
  var password = 'hs2hwQoZe7jivX';
  var tokenUrl = 'https://www.arcgis.com/sharing/generateToken';
  var tokenServer = new ServerInfo();
  tokenServer.tokenServiceUrl = tokenUrl;

  function geocode(str) {
	var addr = str.split('\n').slice(0,2).join()
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?f=pjson&text=" + encodeURIComponent(addr), false);
    xhr.send();
    if (xhr.status == 200) {
      var geom = JSON.parse(xhr.response).locations[0].feature.geometry;
      return new Point(geom.x, geom.y);
    } else {
      app.showNotification('Error:', 'Unable to connect to ESRI Geocode Server.');
      return;
    }
  }

  function getGeoEnrichmentData(points, callback) {
    var url = 'https://geoenrich.arcgis.com/arcgis/rest/services/World/GeoenrichmentServer/Geoenrichment/enrich';
    var args = {
      f: 'json',
      studyAreas: JSON.stringify(arrays.map(points, function(p) {
        return {
          'geometry': {
            'x': p.long,
            'y': p.lat
          }
        };
      }))
    };
    call(url, args, { usePost: true }, callback);
  }

  function _callInternal(url, args, options, callback) {
    esriRequest({
      url: url,
      content: args,
      handleAs: "json"
    }, options).then(function(data) {
      callback(data);
    }, function(data) {
      console.log("Failed to get data at " + url);
    });
  }

  function call(url, args, options, callback) {
    if (!apiKey || !keyExpires || Date.now() - 1000 > keyExpires) {
      refreshApiKey(function() {
        _callInternal(url, args, options, callback);
      }, function() {
        console.log('Failed to login');
      });
    } else {
      _callInternal(url, args, options, callback);
    }
  }

  function refreshApiKey(success, failure) {
    esriId.generateToken(tokenServer, {
      'username': username,
      'password': password
    }, {
      isAdmin: false
    }).then(function(tokenInfo) {
      esriId.registerToken({
        expires: tokenInfo.expires,
        server: tokenServer.tokenServiceUrl,
        ssl: tokenInfo.ssl,
        token: tokenInfo.token,
        userId: username
      });
      apiKey = tokenInfo.token;
      keyExpires = tokenInfo.expires;
      success();
    }, failure);
  }

  return {
    call: call,
    getGeoEnrichmentData: getGeoEnrichmentData,
	geocode: geocode
  };

});
