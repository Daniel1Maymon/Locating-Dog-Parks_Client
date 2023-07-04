

var registerInput = null;
var userBoudary = null;
var emailInput = null;
var locatingDogParksDiv = null;
var loginButton = null;
var succMsg = null;
var backToHomeButton = null;
var roleInput = null;
var usernameInput = null;
var avatarInput = null;
var failedMsgText = null;

var headersBody = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Connection': 'keep-alive'
}

if (window.location.pathname.endsWith('parks')) {
    console.log("::: inside /parks")

    // Get the script element
    var scriptElement = document.currentScript;
    // Get the value from the data-variable attribute
    var variableValue = scriptElement.getAttribute('data-variable');
    console.log('variableValue = ', variableValue)

    var searchInput = document.getElementById('search_input');

    console.log('userBoudary = ', userBoudary)
    var selectedPlace = null;
    var placeLatitude = null;
    var placeLongitude = null;
    var map = null;
    var parks = null;
    var userId = null;

    function getAutocomplete() {
        $(document).ready(function () {
            var autocomplete = new google.maps.places.Autocomplete(searchInput, {
                types: ['geocode'],
            });

            google.maps.event.addListener(autocomplete, 'place_changed', function () {
                var place = autocomplete.getPlace();

                selectedPlace = place;

                saveSelectedPlace();

                getParksFromServer(variableValue)

            });
        });
    }

    function getParksFromServer(data) {
        updateUserRole(data, "SUPERAPP_USER")
        .then(() => {
            console.log(":: getParksFromServer:: after updateUserRole")

            // var objData = setNewParkSearchObject(variableValue)

            getParks(objData)

            updateUserRole(data, "MINIAPP_USER")
        })
        .catch((error) => {
            console.error("Error:", error);
        });
    }

    function setNewParkSearchObject(data) {

        
        // updateUserRole(data, "MINIAPP_USER")
        var objData = createNewParkObejct(data)
        return objData

    }

    async function updateUserRole(data, role) {
        try {
            console.log(data)
            const url = '/update_user_role';
            bodyToSend = {
                'userBoundary': data,
                'role': role
            }
            const reponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyToSend)
            })
                .then(reponse => {
                    if ('error' in response) {
                        console.log("error in data")

                        throw new Error(data.error);
                    }

                    console.log(":: setNewParkSearchObject:: reponse= ", reponse)
                    return data;
                })
                .catch(error => {
                    throw new Error("Update user role request failed");
                });
        } catch (error) {
            console.error("Error:", error);
        }
        
    }


    function saveSelectedPlace() {
        if (selectedPlace) {

            var placeName = selectedPlace.name;
            placeCoordinates = selectedPlace.geometry.location;
            // Retrieve the latitude
            placeLatitude = selectedPlace.geometry.location.lat();
            // Retrieve the longitude
            placeLongitude = selectedPlace.geometry.location.lng();
            $('#selectedPlaceName').val(placeName);


            console.log('Selected Place:', selectedPlace);
            console.log('Place Name:', placeName);
            console.log('Place Latitude:', placeLatitude);
            console.log('Place Longitude:', placeLongitude);

        }
    }

    function getParks() {

        // changeRole("MINIAPP_USER")

        return new Promise((resolve, reject) => {
            const body = {
                "command": "getParks",
                "targetObject": {
                    "objectId": {
                        "superapp": "2023b.ben.el.shervi",
                        "internalObjectId": "eefe8b34-0b33-46a4-9b09-206f9e15a415"
                    }
                },
                "invokedBy": {
                    "userId": {
                        "superapp": "2023b.ben.el.shervi",
                        "email": "daniel2@gmail.com"
                    }
                },
                "commandAttributes": {
                    "radius": 150,
                    "lat": placeLatitude,
                    "lng": placeLongitude
                }
            };

            const url = '/send_get_parks_request'
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Server Response: ')
                    console.log(data)
                    parks = data.results
                    userId = data.invokedBy.userId
                    console.log("userId = ", userId)

                    resolve();
                    return parks;

                })
                .then(parks => {
                    addDistance(parks, placeLatitude, placeLongitude)
                    buildTable(parks)
                    // displayParkList(parks);
                })
                .catch(error => {
                    console.error('Error:', error)
                    reject(error);
                });
        });
    }


    function initMap() {
        var mapOptions = {
            center: { lat: placeLatitude, lng: placeLongitude }, // Center coordinates (e.g., San Francisco)
            zoom: 12 // Initial zoom level
        };

        var map = new google.maps.Map(document.getElementById('map'), mapOptions);

        var request = {
            location: map.getCenter(), // Use the current map center as the search location
            radius: 5000, // Search radius in meters
            type: 'park' // Specify the type of places to search for (e.g., park, restaurant, etc.)
        };

        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, callback);

        function callback(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    createMarker(results[i]);
                }
            }
        }

        function createMarker(place) {
            var marker = new google.maps.Marker({
                position: place.geometry.location,
                map: map
            });

            // console.log("map = ", map)
            // addMarkersToMap(map, parks);

        }

        // function addMarkersToMap(map, parks) {
        //     console.log
        //     for (var i = 0; i < parks.length; i++) {
        //         var park = parks[i];
        //         var marker = new google.maps.Marker({
        //             position: {
        //                 lat: park.location.lat,
        //                 lng: park.location.lng
        //             }, // Park's coordinates
        //             map: map,
        //             title: park.name // Park's name as the marker's title
        //         });
        //     }
        // }

    }

    function displayParkList(parks) {
        var table = document.createElement('table');
        table.classList.add('park-table');

        // Create table header
        var tableHeader = document.createElement('thead');
        var headerRow = document.createElement('tr');
        var nameHeader = document.createElement('th');
        nameHeader.textContent = 'Name';
        headerRow.appendChild(nameHeader);
        tableHeader.appendChild(headerRow);
        table.appendChild(tableHeader);

        // Create table body
        var tableBody = document.createElement('tbody');
        parks.forEach(function (park) {
            var row = document.createElement('tr');
            var nameCell = document.createElement('td');
            nameCell.textContent = park.name;
            row.appendChild(nameCell);
            tableBody.appendChild(row);

            // Add event listener to table row
            row.addEventListener('click', function () {
                // Do something with the selected park
                // console.log('Selected Park:', park);
            });
        });
        table.appendChild(tableBody);

        // Append table to the document
        var parkListContainer = document.getElementById('park-list');
        parkListContainer.innerHTML = ''; // Clear previous results
        parkListContainer.appendChild(table);
    }

    function addDistance(parks, currentLatitude, currentLongitud) {
        for (var i = 0; i < parks.length; i++) {
            var parkLatitude = parks[i].location.lat
            var parkLongitude = parks[i].location.lng

            const distance = calculateDistance(parkLatitude, parkLongitude, currentLatitude, currentLongitud).toFixed(1);
            parks[i].distance = distance

        }
    }

    ///////////////////////
    var ajax = document.createElement('script');
    ajax.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"

    var bootstrapcdn = document.createElement('link');
    bootstrapcdn.rel = "stylesheet"
    bootstrapcdn.href = href = "https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
    document.head.appendChild(ajax);
    document.head.appendChild(bootstrapcdn);


    function buildTable(data) {
        console.log("data = ", data)
        var table = document.getElementById('myTable')
        table.innerHTML = ''


        for (var i = 0; i < data.length; i++) {
            var row = document.createElement('tr');
            var onMyWayCell = document.createElement('td');
            var nameCell = document.createElement('td');
            var addressCell = document.createElement('td');
            var ratingCell = document.createElement('td');
            var distanceCell = document.createElement('td');

            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'circle-checkbox'; // Add circle-checkbox class to the checkbox

            checkbox.addEventListener('click', handleCheckboxClick); // Attach event listener to checkbox

            onMyWayCell.appendChild(checkbox)

            console.log('onMyWayCell.textContent = ', onMyWayCell.textContent)

            nameCell.textContent = data[i].name;
            addressCell.textContent = data[i].formatted_address;
            ratingCell.textContent = data[i].rating;
            distanceCell.textContent = data[i].distance;

            // row.appendChild();
            row.appendChild(onMyWayCell);
            row.appendChild(nameCell);
            row.appendChild(addressCell);
            row.appendChild(ratingCell);
            row.appendChild(distanceCell);
            table.appendChild(row);
        }



    }


    function handleCheckboxClick(event) {
        var checkboxes = document.getElementsByClassName('circle-checkbox');
        var clickedCheckbox = event.target;

        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i] !== clickedCheckbox) {
                checkboxes[i].style.display = checkboxes[i].style.display === 'none' ? '' : 'none';

            }
        }

        var row = clickedCheckbox.parentNode.parentNode;
        var name = row.cells[1].textContent;
        var address = row.cells[2].textContent;

        console.log('Park Name:', name);
        console.log('Park Address:', address);

        createObject(name, address)
    }

    function changeRole(role) {

        console.log("changeRole :: role =", role)
        return new Promise((resolve, reject) => {
            var body = {
                role: role
            }

            console.log("body: ", body)
            console.log("userid: ", userId)
            var superapp = '2023b.ben.el.shervi'
            // path = {"/superapp/users/{superapp}/{userEmail}"},
            const url = 'http://127.0.0.1:8084/superapp/users/' + superapp + "/" + userId.email
            fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            })
                .then(response => response.json())
                .then(data => {
                    console.log('changeRole :: response= ')
                    console.log(data)

                    resolve();
                })

                .catch(error => {
                    console.error('Error:', error)
                    reject(error);
                });
        });


    }

    // function getUser(email){
    //     return 
    // }

    function createObject(parkName, parkAddress) {

        var role = 'SUPERAPP_USER'
        changeRole(role)

        console.log("createObject (after changeRole()):: ")


        var body = {
            "type": "dogParks",
            "alias": "onMyWayPark",
            "active": true,
            "location": {
                "lat": placeLatitude,
                "lng": placeLongitude
            },
            "createdBy": {
                userId
            },
            "objectDetails": {
                parkName: parkName,
                parkAddress: parkAddress
            }
        }

        // http://localhost:8084/superapp/objects
        const url = 'http://127.0.0.1:8084/superapp/objects'

        console.log('createObject :: body', body)
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            },
            body: JSON.stringify(body)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Server Response: ')
                console.log(data)

                // resolve();
                // return parks;
            })

            .catch(error => {
                console.error('Error:', error)
                // reject(error);
            });

        role = 'MINIAPP_USER'
        changeRole(role)
    }

    function toggleCircleColor() {
        // Toggle the color of the circle
        if (this.classList.contains('black')) {
            this.classList.remove('black');
        } else {
            this.classList.add('black');
        }
    }


    $('th').on('click', function () {

        var column = $(this).data('column')
        var order = $(this).data('order')
        var text = $(this).html()
        console.log('Column was clicked!', column, order)
        console.log("parks = ", parks)
        text = text.substring(0, text.length - 1)

        if (order == 'desc') {
            $(this).data('order', 'asc')
            if (parks != null) {
                parks = parks.sort((a, b) => a[column] > b[column] ? 1 : -1)
                text += '&#9660'
            }

        } else {
            $(this).data('order', 'desc')
            if (parks != null) {
                parks = parks.sort((a, b) => a[column] < b[column] ? 1 : -1)
                text += '&#9650'
            }
        }
        $(this).html(text)
        buildTable(parks)
    })

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const earthRadius = 6371; // Radius of the Earth in kilometers

        // Convert latitude and longitude to radians
        const latRad1 = toRadians(lat1);
        const lonRad1 = toRadians(lon1);
        const latRad2 = toRadians(lat2);
        const lonRad2 = toRadians(lon2);

        // Calculate the differences between the latitudes and longitudes
        const latDiff = latRad2 - latRad1;
        const lonDiff = lonRad2 - lonRad1;

        // Use the Haversine formula to calculate the distance
        const a = Math.sin(latDiff / 2) ** 2 + Math.cos(latRad1) * Math.cos(latRad2) * Math.sin(lonDiff / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadius * c;

        return distance;
    }

    function toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }



    // Load the Google Maps API script
    var googleMapsScript = document.createElement('script');
    googleMapsScript.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=places&key=AIzaSyD7OjMNg9kBJ3eCZaSLNs-Nxu6g7vhZ3Ag';
    googleMapsScript.async = true;
    googleMapsScript.defer = true;

    googleMapsScript.onload = function () {
        // Call the initMap function once the Google Maps API is loaded
        getAutocomplete();
    };

    document.head.appendChild(googleMapsScript);

}


if (window.location.pathname.endsWith('register')) {
    registerInput = document.querySelector('.submit');
    succMsg = document.querySelector('.successMessage')
    failedMsgText = document.querySelector(".failedMsgText")
    backToHomeButton = document.getElementById('backToHomeBtn')
    locatingDogParksDiv = document.getElementById('locatingDogParks')


    console.log('registerInput: ', registerInput)

    registerInput.addEventListener('click', function (event) {
        event.preventDefault();
        getFormInput()

        userBoudary = registerUser()
    });

    function getFormInput() {
        // Prevent form submission

        // Get input values
        emailInput = document.querySelector('#emailInput');
        roleInput = document.querySelector('#roleInput'); // Select the input element by its id
        usernameInput = document.querySelector('#usernameInput');
        avatarInput = document.querySelector('#avatarInput');

        // Print input values
        console.log('Email:', emailInput.value);
        console.log('Role:', roleInput.value);
        console.log('Username:', usernameInput.value);
        console.log('Avatar:', avatarInput.value);
    }

    function registerUser() {
        return new Promise((resolve, reject) => {
            const body = {
                "email": emailInput.value,
                "role": roleInput.value,
                "username": usernameInput.value,
                "avatar": avatarInput.value
            };

            // const url = 'http://127.0.0.1:8084/superapp/users'
            const url = '/send_register_request'

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            })
                .then(response => {
                    console.log("response = ", response)

                    // response.headers.forEach((value, name) => {
                    //     console.log(name + ": " + value);
                    // });

                    return response.json()
                })
                .then(data => {
                    console.log("data (response.json()) = ", data)
                    // console.log("data.json() = ", data.json())
                    if ('error' in data) {
                        console.log("error in data")

                        throw new Error(data.error);
                    }
                    else {
                        console.log("error NOT in data")
                        displaySuccMsg();
                        backToHomeButton.style.display = 'block';
                        resolve();
                    }

                })
                .catch(error => {
                    displayErrorMsg();
                    console.log(error);

                    reject(error);
                });
        });
    }

    function reloadHomePage() {
        window.location.href = window.location.origin
    }

    function reloadLocatingParksPage() {
        window.location.href = window.location.origin + '/parks'
    }

    backToHomeButton.addEventListener('click', reloadHomePage);
    locatingDogParksDiv.addEventListener('click', reloadLocatingParksPage)
}


if (window.location.pathname.endsWith('login')) {
    // Make an AJAX request to fetch the current userBoundary value
    // $.ajax({
    //     url: '/login',
    //     method: 'GET',
    //     success: function (response) {
    //         var userBoundary = response.user_boundary;
    //         // Use the userBoundary value as needed
    //         console.log("parks :: userBoundary= ", userBoundary)
    //     }
    // });




    // Add event listener to the 'Register' input
    loginInputField = document.getElementById('loginInput')
    backToHomeButton = document.getElementById("backToHomeBtn")
    loginButton = document.getElementById('loginBtn');
    succMsg = document.querySelector('.successMessage')
    backToHomeButton = document.getElementById('backToHomeBtn')
    locatingDogParksDiv = document.getElementById('locatingDogParks')
    var failedMsgText = document.querySelector(".failedMsgText")

    backToHomeButton.style.display = 'none';

    loginInputField.addEventListener('click', function (event) {
        event.preventDefault();
        getFormInput()

        userBoudary = loginUser(emailInput.value)
        // saveUserBoundaryInSession(userBoudary)
    });

    function getFormInput() {
        // Prevent form submission

        // Get input values
        emailInput = document.querySelector('#emailInput');
        roleInput = document.querySelector('#roleInput'); // Select the input element by its id

    }

    function loginUser(email) {
        return new Promise((resolve, reject) => {

            const url = '/send_login_request';

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "email": emailInput.value })
            })
                .then(response => {
                    console.log("response = ", response)

                    return response.json()
                })
                .then(data => {
                    console.log("data (response.json()) = ", data)
                    // console.log("data.json() = ", data.json())
                    if ('error' in data) {
                        console.log("error in data")

                        throw new Error(data.error);
                    }
                    else {
                        console.log("error NOT in data")
                        displaySuccMsg();
                        backToHomeButton.style.display = 'block';
                        saveUserBoundaryInSession(data)
                        resolve();
                    }

                })
                .catch(error => {
                    displayErrorMsg();
                    console.log(error);

                    reject(error);
                });
        });
    }

    function reloadHomePage() {
        window.location.href = window.location.origin
    }

    function reloadLocatingParksPage() {
        window.location.href = window.location.origin + '/parks'
    }

    backToHomeButton.addEventListener('click', reloadHomePage);
    locatingDogParksDiv.addEventListener('click', reloadLocatingParksPage)

}

if (typeof currentHTMLFile !== 'undefined') {
    console.log(" :: inside home_page scripts ::")
    var loginButton = document.getElementById('loginBtn');
    var registerButton = document.getElementById('registerBtn');


    function reloadLoginPage() {
        window.location.href = window.location.origin + '/login'
    }

    function reloadRegistrationPage() {
        window.location.href = window.location.origin + '/register'
    }


    loginButton.addEventListener('click', reloadLoginPage);
    registerButton.addEventListener('click', reloadRegistrationPage)
}

function displayErrorMsg() {
    failedMsgText.style.display = 'flex';
    succMsg.style.display = 'none';

    if (typeof locatingDogParksDiv !== 'undefined' && locatingDogParksDiv !== null) {
        locatingDogParksDiv.style.display = 'none'
    }
}

function displaySuccMsg() {

    failedMsgText.style.display = 'none';
    succMsg.style.display = 'flex';
    backToHomeButton.style.display = 'block'
    if (typeof locatingDogParksDiv !== 'undefined' && locatingDogParksDiv !== null) {
        locatingDogParksDiv.style.display = 'block'
    }

    if (typeof locatingDogParksDiv !== 'undefined' && locatingDogParksDiv !== null) {
        locatingDogParksDiv.style.display = 'block'
    }

    if (typeof document.getElementById('registerBtn') !== 'undefined' && document.getElementById('registerBtn') !== null) {
        document.getElementById('registerBtn').style.display = 'none'
    }

}

function saveUserBoundaryInSession(data) {
    console.log(':: saveUserBoundaryInSession:: data= ', data)

    fetch('/update_variable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "userBoundary": data })
    })
        .then(data => { return data.json() })
        .then(dataResponse => {
            console.log("data response from /update_variable: ")
            console.log(dataResponse)
        })
        .catch(error => {
            console.log(error)
        })
}