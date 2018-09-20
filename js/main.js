/*********************
 Main AngularJS 
*********************/
var app = angular.module('portfolio', [
'ngRoute'
]);

/*********************
 Routes
*********************/
app.config(['$routeProvider', function ($routeProvider) {
$routeProvider
    // home
    .when("/", {templateUrl: "partials/home.html", controller: "PageCtrl"})
    // pages
    .when("/about", {templateUrl: "partials/about.html", controller: "PageCtrl"})
    .when("/services", {templateUrl: "partials/services.html", controller: "PageCtrl"})
    .when("/portfolio", {templateUrl: "partials/portfolio.html", controller: "PageCtrl"})
    .when("/contact", {templateUrl: "partials/contact.html", controller: "PageCtrl"})
    // blog
    .when("/blog", {templateUrl: "partials/blog.html", controller: "BlogCtrl"})
    .when("/blog/post", {templateUrl: "partials/blog_post.html", controller: "BlogCtrl"})
    // else 404
    .otherwise("/error", {templateUrl: "partials/error.html", controller: "PageCtrl"});
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

 // Activates the Carousel
 $('.carousel').carousel({
   interval: 5000
 });

 // Activates Tooltips for Social Links
 $('.tooltip-social').tooltip({
   selector: "a[data-toggle=tooltip]"
 })

});
