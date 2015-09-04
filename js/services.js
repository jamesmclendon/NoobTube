angular.module('NoobTubeApp.services', []).

    factory('VideosService', ['$cookies', '$http', '$window', '$log', function ($cookies, $http, $window, $log) {

    var service = this;

    var youtube = {
        ready: false,
        player: null,
        playerId: null,
        videoId: null,
        videoTitle: null
    };
    var results = [];
    var comments = [];
    var favorites;
    favorites = $cookies.getObject('favorites', favorites) || [];

    function onYoutubeReady() {
        $log.info('YouTube Player is ready');
    }

    bindPlayer = function (elementId) {
        $log.info('Binding to ' + elementId);
        youtube.playerId = elementId;
    };

    createPlayer = function () {
        return new YT.Player(youtube.playerId, {
            playerVars: {
                rel: 0,
                showinfo: 0
            },
            events: {
                onReady: onYoutubeReady
            }
        });
    };

    loadPlayer = function () {
        if (youtube.ready && youtube.playerId) {
            if (youtube.player) {
                youtube.player.destroy();
            }
            youtube.player = createPlayer();
        }
    };

    $window.onYouTubeIframeAPIReady = function () {
        $log.info('Youtube API is ready');
        youtube.ready = true;
        bindPlayer('videoPlayer');
        loadPlayer();
    };
    
    launchPlayer = function (id, title, author, description, likes, dislikes, thumbnail) {
        youtube.player.loadVideoById(id);
        youtube.videoId = id;
        youtube.videoTitle = title;
        youtube.videoAuthor = author;
        youtube.videoDescription = description;
        youtube.videoLikes = likes;
        youtube.videoDislikes = dislikes;
        youtube.videoThumbnail = thumbnail;
        return youtube;
    };

    listResults = function (data) {
        results.length = 0;
        data.items.forEach(function (item) {
            // set author if channelTitle is not empty
            if (item.snippet.channelTitle) {
                var author = "by " + item.snippet.channelTitle;
            }
            results.push({
                id: item.id.videoId,
                title: item.snippet.title,
                author: author,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.default.url
            });
        });
        return results
    };

    this.toggleFavorite = function (id, title, author, description, thumbnail) {
        // if favorites exist and this is one of them, delete it
        if ((favorites) && (JSON.stringify(favorites).indexOf(id) > -1)) {
            var i;
            for (i = favorites.length - 1; i >= 0; i -= 1) {
                if (favorites[i].id === id) {
                    favorites.splice(i, 1);
                    break;
                }
            }
            $log.info('Unfavorited id: ' + id + ', title:' + title);
        // otherwise add favorite
        } else {
            favorites.push({
                id: id,
                title: title,
                author: author,
                description: description,
                thumbnail: thumbnail
            });
            $log.info('Favorited id: ' + id + ', title:' + title);
        }
        
        // set cookie
        var expireDate = new Date();
        // set cookie expiration date to 30 days
        expireDate.setDate(expireDate.getDate() + 30);
        $cookies.putObject('favorites', favorites, {expires: expireDate});
        
        return favorites;
    };

    listComments = function (data) {
        data.data.items.forEach(function (item) {
            comments.push({
                author: item.snippet.topLevelComment.snippet.authorDisplayName,
                content: item.snippet.topLevelComment.snippet.textDisplay,
                published: item.snippet.topLevelComment.snippet.publishedAt,
                thumbnail: item.snippet.topLevelComment.snippet.authorProfileImageUrl
            });
        });
        return comments;
    };

    this.getYoutube = function () {
        return youtube;
    };

    this.getResults = function () {
        return results;
    };

    this.getfavorites = function () {
        return favorites;
    };

    this.getComments = function () {
        return comments;
    };

    // search
    var youtubeKey = 'AIzaSyAD-k8DZ85QM3k1yDnrm1sE_73tHdmAgS8';
    
    this.search = function (query, coord, radius, sortOrder) {
        $http.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: youtubeKey,
                type: 'video',
                maxResults: '50',
                part: 'id,snippet',
                fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
                q: query,
                location: coord,
                locationRadius: radius,
                order: sortOrder
            }
        }).then(function (response) {
            listResults(response.data);
            loadPlayer(); // kill video, if loaded
            $log.info(response.data);
            // success handler
        },
        function () {
            $log.info('Search error');
            // error handler
        });
    };
    
    this.launch = function (id, title, author, description, thumbnail) {

        // likes & dislikes
        $http.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                key: youtubeKey,
                part: 'statistics',
                id: id,
                fields: 'items/statistics/likeCount,items/statistics/dislikeCount'
            }
        }).then(function (result) {
                $log.info(result.data);
                var likes = angular.fromJson(result.data.items[0].statistics.likeCount);
                var dislikes = angular.fromJson(result.data.items[0].statistics.dislikeCount);
                launchPlayer(id, title, author, description, likes, dislikes, thumbnail);
                // scroll to top of page
                $window.scrollTo(0, 0);
                $log.info('Playing id: ' + id + ', title:' + title);
            });

        // comments
        $http.get('https://www.googleapis.com/youtube/v3/commentThreads', {
            params: {
                key: youtubeKey,
                part: 'snippet',
                videoId: id,
                fields: 'items/snippet/topLevelComment/snippet/authorDisplayName,items/snippet/topLevelComment/snippet/textDisplay,items/snippet/topLevelComment/snippet/publishedAt,items/snippet/topLevelComment/snippet/authorProfileImageUrl'
            }
        }).then(function (data) {
            listComments(data);
        });

    };
    
    return service;

}]);