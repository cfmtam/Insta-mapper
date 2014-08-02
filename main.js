var ct = ct || {};

(function() {
    var DEFAULT_LOCATION = new google.maps.LatLng(43.473129, -80.54168700000002);

    ct.initialize = function initialize() {
        ct.map = new google.maps.Map(dGet("map-canvas"), {
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        ct.infoWindow = new google.maps.InfoWindow();

        ct.search();
    }

    ct.search = function search() {
        dGet("picture-grid").innerHTML = "";

        if (dGet('location-box').value != "") {
            new google.maps.Geocoder().geocode({ 
                'address': dGet('location-box').value 
            }, function(results, status) {
                var pos = DEFAULT_LOCATION;
                if (status == google.maps.GeocoderStatus.OK) {
                    pos = results[0].geometry.location;
                } else {
                    console.log("Error: Geocode failed with status " + status);
                }
                ct.map.setCenter(pos);
                searchNearby(pos);
            });
        } else {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    ct.map.setCenter(pos);
                    searchNearby(pos);
                }, function() {
                    console.log("Geolocation not available");
                    var pos = DEFAULT_LOCATION;
                    ct.map.setCenter(pos);
                    searchNearby(pos);
                });
            }
        }
    }

    // Autocomplete on textbox
    ct.autoComplete = function autoComplete() {
        new google.maps.places.Autocomplete(
            dGet('location-box'), 
            { 
                types: ['geocode'] 
            }
        );
    }

    // Search for a location
    ct.searchLocation = function searchLocation(e) {
        if (e.keyCode == 13) {
            ct.search();
        }
    }

    // Search for restaurants
    function searchNearby(location) {
        new google.maps.places.PlacesService(ct.map).nearbySearch(
            {
                location: location,
                radius: 1500,
                types: ['restaurant']
            }, 
            function(results, status, pagination) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    for (var i = 0; i < results.length; i++) {
                        createMarker(results[i]);
                    }
                } else {
                    console.log("Error: Nearby Search failed with status " + status);
                }
            }
        );
    }

    // Markers for locations
    function createMarker(place) {
        var marker = new google.maps.Marker({
            map: ct.map,
            position: place.geometry.location
        });

        google.maps.event.addListener(marker, 'click', function() {
            ct.infoWindow.setContent(place.name);
            ct.infoWindow.open(ct.map, this);
            showFood(place.name);
        });
    }

    // Request and display
    function showFood(name){
        var url = 'https://api.instagram.com/v1/tags/' + 
            name.replace(/[^\w]/gi,'') + 
            '/media/recent?client_id=5d8f620fab534583a05a451b4d1c2019';

        $.ajax({
            type: "GET",
            dataType: "jsonp",
            cache: false,
            url: url,
            success: function(response) {
                dGet("picture-grid").innerHTML = "";

                if (response.meta.code === 200) {
                    if (response.data.length <= 0) {
                        var msg = document.createElement("div");
                        msg.innerHTML = "No pictures found!";
                        msg.className = "msg-box";
                        dGet("picture-grid").appendChild(msg);
                    } else {
                        response.data.forEach(function(el) { 
                            var a = document.createElement("a");
                            a.href = el.link;
                            a.target = "_blank";

                            var img = document.createElement("img");
                            img.src = el.images.thumbnail.url;
                            img.className = "instagram-picture";
                            img.width = 100;
                            img.height = 100;

                            a.appendChild(img);
                            dGet("picture-grid").appendChild(a);
                        });
                    }
                } else {
                    console.log("Error: Instagram query failed with message " + response.meta.error_message);
                }
            }
        });
    }

    function dGet(id) {
        return document.getElementById(id);
    }

})();

google.maps.event.addDomListener(window, 'load', ct.initialize);