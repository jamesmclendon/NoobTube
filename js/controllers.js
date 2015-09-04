angular.module('NoobTubeApp.controllers', []).

controller('VideosController', ['$scope', '$http', '$log', '$window', 'VideosService', function ($scope, $http, $log, $window, VideosService) {

    function init() {
        $scope.youtube = VideosService.getYoutube();
        $scope.results = VideosService.getResults();
        $scope.favorites = VideosService.getfavorites();
        $scope.comments = VideosService.getComments();
    }

    init();

    // search on page load
    VideosService.search();

    // set search to default tab
    $scope.active = {
      search: true
    };
    
    // location
    google.maps.event.addDomListener(window, 'load', initialize);
    function initialize() {
        var input = document.getElementById('searchTextField');
        var autocomplete = new google.maps.places.Autocomplete(input);
        google.maps.event.addListener(autocomplete, 'place_changed', function () {
            var place = autocomplete.getPlace();
            $scope.coord = (place.geometry.location.lat() + ", " + place.geometry.location.lng());
            $scope.radius = '50km';
        });
    }
    
    // search
    $scope.search = function () {
        if (this.location === "") {
            $scope.coord = null;
            $scope.radius = null;
        };
        VideosService.search($scope.query, $scope.coord, $scope.radius, $scope.sortOrder);
        $scope.showPlayer = false;
        // activate search tab
        $scope.active = {}; //reset
        $scope.active['search'] = true;
    };

    // sort order
    $scope.options = ['Relevance', 'Rating', 'Date'];
    $scope.sortOrder = $scope.options[0];

    // favorites
    $scope.toggleFavorite = function (id, title, author, description, thumbnail) {
        VideosService.toggleFavorite(id, title, author, description, thumbnail);
    };
    $scope.favStatus = function(id) {
        if (JSON.stringify($scope.favorites).indexOf(id) > -1) {
            return true;
        }
    };
    
    // launch player
    $scope.launch = function (id, title, author, description, thumbnail) {
        VideosService.launch(id, title, author, description, thumbnail);
        $scope.showPlayer = true;
    };
}]);