(function() {
  var myApp = angular.module('myApp', ['ngRoute']);
  
  myApp.config(function($routeProvider) {
    $routeProvider
    .when('/',
    {
      controller : 'MainController',
      templateUrl : 'partials/view1.html'
    })
    .when('/view2/:appName',
    {
      controller: 'DetailController',
      templateUrl : 'partials/view2.html'
    })
    .otherwise({redirectTo: '/'});

  });

  // main app controller
  myApp.controller('MainController', function($scope, $filter) {
    $scope.listdata = fortidata;
    $scope.searchLimit = 20;
    $scope.filteredData = fortidata;

    // to translate numerical values to textual values
    $scope.application_technology = ['Browser-Based', 'Network-Protocol', 'Client-Server', 'Peer-to-Peer'];
    $scope.popularity_levels = ['Low', 'Medium', 'High'];
    $scope.risk_levels = ['Low', 'Medium', 'High'];

    // responds to show more button
    $scope.incrementLimit = function() {
      $scope.searchLimit += 20;
    };

    // responds to the changes in the search fields and filters the data
    $scope.$watch('search',function(old, nw) {
      $scope.filteredData = $filter('filter')($scope.listdata, $scope.search);
    }, true);
  });

  // detail controller responsible for showing application details
  myApp.controller('DetailController', function($scope, $routeParams) {
    $scope.appName = $routeParams.appName;
    $scope.currentData = [];
    for (var i = 0; i<fortidata.length; i++) {
      if (fortidata[i][0] == $scope.appName) {
        $scope.currentData = fortidata[i];
        break;
      }
    }
    console.log($scope.currentData);
  });


  // bar chart directive
  myApp.directive('barChart', function(){
    function link(scope, el, attr){

      var margin = {top: 10, right: 50, bottom: 80, left: 50},
      width = 500 - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom;

      var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .05, .3);

      var y = d3.scale.linear()
      .range([height, 0]);

      var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

      var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")


      var svg = d3.select(el[0]).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


      svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")");


      svg.append("g")
      .attr("class", "y axis");



      function update() {
        // Grouping the data by app type
        mydata = d3.nest()
        .key(function(d) { return d[1]; })
        .rollup(function(leaves) { return leaves.length; })
        .entries(scope.data);

        // Update the axis
        x.domain(mydata.map(function(d) { return d.key; }));
        y.domain([0, d3.max(mydata, function(d) { return d.values; })]);
        yAxis.scale(y);
        xAxis.scale(x);

        svg.selectAll("g.y.axis")
        .call(yAxis);

        svg.selectAll("g.x.axis")
        .call(xAxis)
        .selectAll(".tick text")            
        .attr("dy", ".50em")
        .attr("dx", "-.20em")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");            

        // Update the chart
        mychart = svg.selectAll(".bar")
        .data(mydata);
        mychart.enter()
        .append("rect")
        .attr("class", "bar");
        mychart.exit()
        .transition()
        .duration(300)
        .ease("exp")
        .attr("width", 0)
        .remove();

        mychart.transition()
        .duration(300)
        .ease("quad")
        .attr("x", function(d) { return x(d.key); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.values); })
        .attr("height", function(d) { return height - y(d.values); });

      }

      scope.$watch('data',function(value) {          
        update();
      }, true);



    }
    return {
      link: link,
      restrict: 'E', 
      scope: { data: '='}
    };
  });

// pie (aka dounut) chart directive
myApp.directive('pieChart', function(){
  function link(scope, el, attr){
    var gindex = scope.gindex;        
        //var color = d3.scale.category10();
        console.log(scope.colors);
        var scheme = {"YlOrRd": colorbrewer.YlOrRd[3], "PRGn": colorbrewer.PRGn[4], "BuPu": colorbrewer.BuPu[3]};
        
        // Calculating the color scale
        var scaleData = d3.nest()
        .key(function(d) { return d[gindex]; })
        .rollup(function(leaves) { return leaves.length; })
        .entries(scope.data);
        
        var categories = scaleData.map(function (item) { return item.key; }).sort();
        
        var color = d3.scale.ordinal()
        .domain(categories)
        .range(scheme[scope.colors]);

        
        var width = 200;
        var height = 200;
        var margin_bottom = 50;
        var min = Math.min(width, height);
        console.log(el.width());
        var svg = d3.select(el[0]).append('svg');
        var pie = d3.layout.pie().sort(null);
        var arc = d3.svg.arc()
        .outerRadius(min / 2 * 0.9)
        .innerRadius(min / 2 * 0.5);

        pie.value(function(d){ return d.values; });

        svg.attr({width: width, height: height+margin_bottom});

        // group for the legend
        var legendg = svg.append('g')
        .attr('transform', 'translate(' + width / 2 + ',' + (height + margin_bottom -45) + ')');
        var legrect = legendg.selectAll('rect')
        .data(scaleData)
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", function(d, i){ return i*10-10;})
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function(d) {             
          return color(d.values);
        });

        legendg.selectAll('text')
        .data(scaleData)
        .enter()
        .append("text")
        .attr("x", 15)
        .attr("class", 'arcLabel')
        .attr("y", function(d, i){ return (d.key-1) *  10;})
        .text(function(d) {
          var text = scope.labels[d.key-1];
          return text;
        });

        // group for the chart
        var g = svg.append('g')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

        // group for labels
        var labelg = svg.append("g")
        .attr("class", "lblGroup")
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

        
        // add the <path>s for each arc slice
        var arcs = g.selectAll('path');
        var sliceLabel = labelg.selectAll("text")

        function arcTween(a) {
          var i = d3.interpolate(this._current, a);
          this._current = i(0);
          return function(t) {
            return arc(i(t));
          };
        }          


        scope.$watch('data', function(value){
          var mydata = d3.nest()
          .key(function(d) { return d[gindex]; })
          .rollup(function(leaves) { return leaves.length; })
          .entries(value);
          
          arcs = arcs.data(pie(mydata));
          arcs.enter().append('path')
          .style('stroke', 'white')
          .each(function(d) {this._current = d});        
          arcs.exit()
          .remove();
          arcs
          .transition().ease("quad").duration(300)
          .attrTween('d', arcTween)
          .attr('fill', function(d, i){ return color(d.data.key); })
          

          
          sliceLabel = sliceLabel.data(pie(mydata));
          sliceLabel.enter().append("text")
          .attr("class", "arcLabel")          
          .attr("text-anchor", "middle");          
          sliceLabel.exit().remove();
          sliceLabel
          .transition().ease("quad").duration(300)
          .text(function(d, i) {return d.data.values;})
          .attr("transform", function(d) {return "translate(" + arc.centroid(d) + ")"; });
        }, true);
}
return {
  link: link,
  restrict: 'E',
  scope: { data: '=', gindex: '=', colors: "=", labels: "=", }
};
});

}());
