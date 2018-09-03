/*********************
 Main AngularJS 
*********************/
var app = angular.module('tutorialWebApp', [
'ngRoute'
]);

/*********************
 Routes
*********************/
app.config(['$routeProvider', function ($routeProvider) {
$routeProvider
    // home
    .when("/", {templateUrl: "partials/home.html", <span class="highlight">controller: "PageCtrl"</span>})
    // pages
    .when("/about", {templateUrl: "partials/about.html", <span class="highlight">controller: "PageCtrl"</span>})
    .when("/work", {templateUrl: "partials/work.html", <span class="highlight">controller: "PageCtrl"</span>})
    .when("/dataviz", {templateUrl: "partials/dataviz.html", <span class="highlight">controller: "PageCtrl"</span>})
    .when("/media", {templateUrl: "partials/media.html", <span class="highlight">controller: "PageCtrl"</span>})
    // blog
    .when("/blog", {templateUrl: "partials/blog.html", <span class="highlight">controller: "BlogCtrl"</span>})
    .when("/blog/post", {templateUrl: "partials/blog_post.html", <span class="highlight">controller: "BlogCtrl"</span>})
    // else 404
    .otherwise("/error", {templateUrl: "partials/error.html", <span class="highlight">controller: "PageCtrl"</span>});
}]);