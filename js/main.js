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
    
/*********************
 Controls Blog
*********************/
app.controller('BlogCtrl', function (/* $scope, $location, $http */) {
  console.log("Blog Controller reporting for duty.");
});

/*********************
 Controls Pages
*********************/
app.controller('PageCtrl', function (/* $scope, $location, $http */) {
  console.log("Page Controller reporting for duty.");

//  // Activates the Carousel
//  $('.carousel').carousel({
//    interval: 5000
//  });
//
//  // Activates Tooltips for Social Links
//  $('.tooltip-social').tooltip({
//    selector: "a[data-toggle=tooltip]"
//  })

});