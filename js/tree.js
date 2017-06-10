function tree(data, metrics) {
  // var source = PMV.fillRoots(data);
  var roots = PMV.treeify(data);

  var root = roots.length == 1 ? roots : {"name": "root", "children": roots};
  console.log(root);
  height = 800;
  // this cannot have multiple roots
  // var root = d3.stratify()
  //     .id(function(d) { return d.id; })
  //     .parentId(function(d) { return d.parent; })
  //     (source);

  var i = 0,
      duration = 750,
      rectW = 60,
      rectH = 30;

  var wmax = d3.max(data, function(d) { return PMV.getMetric(d, metrics.width) });
  var hmax = d3.max(data, function(d) { return PMV.getMetric(d, metrics.height) });

  var wscale = d3.scale.linear()
 	  .domain([0, wmax])
    .rangeRound([5, 50]);

  var hscale = d3.scale.linear()
    .domain([0, hmax])
    .rangeRound([5, 50]);

  var tree = d3.layout.tree().nodeSize([70, 40]);
  var diagonal = d3.svg.diagonal()
      .projection(function (d) {
        return [d.x, d.y];
  });
  // delete the previous chart
  d3.selectAll("svg").remove();

  var svg = d3.select("body").append("svg").attr("width", 1000).attr("height", 1000)
      .call(zm = d3.behavior.zoom().scaleExtent([1,3]).on("zoom", redraw)).append("g")
      .attr("transform", "translate(" + 350 + "," + 20 + ")");

  //necessary so that zoom knows where to zoom and unzoom from
  zm.translate([350, 20]);

  root.x0 = 0;
  root.y0 = height / 2;

  function collapse(d) {
      if (d.children) {
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
      }
  }

  root.children.forEach(collapse);
  update(root);

  function update(source) {
      // Compute the new tree layout.
      var nodes = tree.nodes(root).reverse(),
          links = tree.links(nodes);

      // Normalize for fixed-depth.
      nodes.forEach(function (d) {
          d.y = d.depth * 180;
      });

      // Update the nodes…
      var node = svg.selectAll("g.node")
          .data(nodes, function (d) {
          return d.id || (d.id = ++i);
      });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("g")
          .attr("class", "node")
          .attr("transform", function (d) {
          return "translate(" + source.x0 + "," + source.y0 + ")";
      })
          .on("click", click);

      nodeEnter.append("rect")
          .attr("width", function (d) {
            console.log(PMV.getMetric(d, metrics.width));
            return wscale(PMV.getMetric(d, metrics.width));
          })
          .attr("height", function (d) {
            return hscale(PMV.getMetric(d, metrics.height));
          })
          .attr("stroke", "black")
          .attr("stroke-width", 1)
          .style("fill", function (d) {
          return d._children ? "lightsteelblue" : "#fff";
      });

      // Transition nodes to their new position.
      var nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function (d) {
          return "translate(" + d.x + "," + d.y + ")";
      });

      nodeUpdate.select("rect")
          .attr("width", function (d) {
            return wscale(PMV.getMetric(d, metrics.width));
          })
          .attr("height", function (d) {
            return hscale(PMV.getMetric(d, metrics.height));
          })
          .attr("stroke", "black")
          .attr("stroke-width", 1)
          .style("fill", function (d) {
          return d._children ? "lightsteelblue" : "#fff";
      });

      // nodeUpdate.select("text")
      //     .style("fill-opacity", 1);

      // Transition exiting nodes to the parent's new position.
      var nodeExit = node.exit().transition()
          .duration(duration)
          .attr("transform", function (d) {
          return "translate(" + source.x + "," + source.y + ")";
      })
          .remove();

      nodeExit.select("rect")
          .attr("width", function (d) {
            return wscale(PMV.getMetric(d, metrics.width));
          })
          .attr("height", function (d) {
            return hscale(PMV.getMetric(d, metrics.height));
          })
      //.attr("width", bbox.getBBox().width)""
      //.attr("height", bbox.getBBox().height)
      .attr("stroke", "black")
          .attr("stroke-width", 1);

      // nodeExit.select("text");

      // Update the links…
      var link = svg.selectAll("path.link")
          .data(links, function (d) {
          return d.target.id;
      });

      // Enter any new links at the parent's previous position.
      link.enter().insert("path", "g")
          .attr("class", "link")
          .attr("x", rectW / 2)
          .attr("y", rectH / 2)
          .attr("d", function (d) {
          var o = {
              x: source.x0,
              y: source.y0
          };
          return diagonal({
              source: o,
              target: o
          });
      });

      // Transition links to their new position.
      link.transition()
          .duration(duration)
          .attr("d", diagonal);

      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
          .duration(duration)
          .attr("d", function (d) {
          var o = {
              x: source.x,
              y: source.y
          };
          return diagonal({
              source: o,
              target: o
          });
      })
      .remove();

      // Stash the old positions for transition.
      nodes.forEach(function (d) {
          d.x0 = d.x;
          d.y0 = d.y;
      });

      link.each(function(d){
          if (d.source.name == "root") {
            d3.select(this).remove();
          }
      });
      nodeEnter.each(function(d){
          if (d.name == "root") {
            d3.select(this).remove();
          }
      });
      nodeUpdate.each(function(d){
          if (d.name == "root") {
            d3.select(this).remove();
          }
      });
      nodeExit.each(function(d){
          if (d.name == "root") {
            d3.select(this).remove();
          }
      });
      svg.selectAll("rect").call(tooltip());

  }

  // Toggle children on click.
  function click(d) {
      if (d.children) {
          d._children = d.children;
          d.children = null;
      } else {
          d.children = d._children;
          d._children = null;
      }
      update(d);
  }

  //Redraw for zoom
  function redraw() {
    //console.log("here", d3.event.translate, d3.event.scale);
    svg.attr("transform",
        "translate(" + d3.event.translate + ")"
        + " scale(" + d3.event.scale + ")");
  }
}
