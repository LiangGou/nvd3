
nv.models.stackedAreaWithFocusChart = function() {

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var stacked = nv.models.stackedArea()
    , stacked2 = nv.models.stackedArea()
    , xAxis = nv.models.axis()
    , yAxis = nv.models.axis()
    , x2Axis = nv.models.axis()
    , y2Axis = nv.models.axis()
    , legend = nv.models.legend()
    , brush = d3.svg.brush()
    , controls = nv.models.legend()
    ;
  
  var margin = {top: 0, right: 25, bottom: 30, left: 60}
  	, margin2 = {top: 0, right: 25, bottom: 0, left: 60}
  	, color = nv.utils.defaultColor() // a function that takes in d, i and returns color
    , width = null
    , height = null
    , height2 = 60
    , x //can be accessed via chart.xScale()
    , y //can be accessed via chart.yScale()
    , x2
    , y2
    , showControls = true
    , showLegend = true
    , brushExtent = null
    , tooltips = true
    , tooltip = function(key, x, y, e, graph) {
        return '<h3>' + key + '</h3>' +
               '<p>' +  y + ' on ' + x + '</p>'
      }
    , yAxisTickFormat = d3.format(',.2f')
    , y2AxisTickFormat = d3.format(',.2f')
    , noData = 'No Data Available.'
    , dispatch = d3.dispatch('tooltipShow', 'tooltipHide','brush','scatterClick')
    ;

  xAxis
    .orient('bottom')
    .tickPadding(7)
    ;
  yAxis
    .orient('left')
    ;
    
  x2Axis
    .orient('bottom')
    .tickPadding(7)
    ;
  y2Axis
    .orient('left')
    ;
  stacked.scatter
    .pointActive(function(d) {
      //console.log(stacked.y()(d), !!Math.round(stacked.y()(d) * 100));
      return !!Math.round(stacked.y()(d) * 100);
    })
    ;
    
  stacked
    .clipEdge(false)
    ;
  stacked2.interactive(false);

  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var showTooltip = function(e, offsetElement, myClass) {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
        top = e.pos[1] + ( offsetElement.offsetTop || 0),
        x = xAxis.tickFormat()(stacked.x()(e.point, e.pointIndex)),
        y = yAxis.tickFormat()(stacked.y()(e.point, e.pointIndex)),
        content = tooltip(e.series.key, x, y, e, chart);

    nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's', null, offsetElement,null, myClass);
  };

  //============================================================


  function chart(selection) {
    selection.each(function(data) {
    	
      var container = d3.select(this),
          that = this;

      var availableWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right,
          availableHeight1 = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom- height2;
          availableHeight2 = height2 - margin2.top - margin2.bottom;

      chart.update = function() { chart(selection) };
      
      chart.container = this;
      
      //------------------------------------------------------------
      // Display No Data message if there's nothing to show.

      if (!data || !data.length || !data.filter(function(d) { return d.values.length }).length) {
        var noDataText = container.selectAll('.nv-noData').data([noData]);

        noDataText.enter().append('text')
          .attr('class', 'nvd3 nv-noData')
          .attr('dy', '-.7em')
          .style('text-anchor', 'middle');

        noDataText
          .attr('x', margin.left + availableWidth / 2)
          .attr('y', margin.top + availableHeight / 2)
          .text(function(d) { return d });

        return chart;
      } else {
        container.selectAll('.nv-noData').remove();
      }

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup Scales

      x = stacked.xScale();
      y = stacked.yScale();
      x2 = stacked2.xScale();
      y2 = stacked2.yScale();

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-stackedAreaWithFocusChart').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-stackedAreaWithFocusChart').append('g');
      var g = wrap.select('g');    
      
      gEnter.append('g').attr('class', 'nv-legendWrap');
      gEnter.append('g').attr('class', 'nv-controlsWrap');

      var focusEnter = gEnter.append('g').attr('class', 'nv-focus');
      focusEnter.append('g').attr('class', 'nv-x nv-axis');
      focusEnter.append('g').attr('class', 'nv-y nv-axis');
      focusEnter.append('g').attr('class', 'nv-stackedWrap');

      var contextEnter = gEnter.append('g').attr('class', 'nv-context');
      contextEnter.append('g').attr('class', 'nv-x nv-axis');
      contextEnter.append('g').attr('class', 'nv-y nv-axis');
      contextEnter.append('g').attr('class', 'nv-stackedWrap');
      contextEnter.append('g').attr('class', 'nv-brushBackground');
      contextEnter.append('g').attr('class', 'nv-x nv-brush');


      //------------------------------------------------------------


      //------------------------------------------------------------
      // Legend

      if (showLegend) {
        legend
          .width( availableWidth * 3 / 4 );

        g.select('.nv-legendWrap')
            .datum(data)
            .call(legend);

        if ( margin.top != legend.height()) {
          margin.top = legend.height();
          availableHeight1 = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom- height2;
        }

        g.select('.nv-legendWrap')
            .attr('transform', 'translate(' + ( availableWidth * 1 / 4 ) + ',' + (-margin.top) +')');
      }

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Controls

      if (showControls) {
        var controlsData = [
          { key: 'Stacked', disabled: stacked.offset() != 'zero' },
          { key: 'Stream', disabled: stacked.offset() != 'wiggle' },
          //{ key: 'Silhouette', disabled: stacked.offset() != 'silhouette' },
          { key: 'Expanded', disabled: stacked.offset() != 'expand' }
        ];

        controls
          .width( Math.min(280, availableWidth * 1 / 4) )
          .color(['#444', '#444', '#444']);

        g.select('.nv-controlsWrap')
            .datum(controlsData)
            .call(controls);


        if ( margin.top != Math.max(controls.height(), legend.height()) ) {
          margin.top = Math.max(controls.height(), legend.height());
          availableHeight1 = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom- height2;
        }


        g.select('.nv-controlsWrap')
            .attr('transform', 'translate(0,' + (-margin.top) +')');
      }

      //------------------------------------------------------------


      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      //------------------------------------------------------------
      // Main Chart Component(s)

      stacked
        .width(availableWidth)
        .height(availableHeight1);
        
      stacked2
        //.defined(stacked.defined())
        .width(availableWidth)
        .height(availableHeight2);
        
      g.select('.nv-context')
          .attr('transform', 'translate(0,' + ( availableHeight1 + margin.bottom + margin2.top) + ')')


     // var focusStackedWrap = g.select('.nv-focus .nv-stackedWrap')
          // .datum(data);
      // //d3.transition(stackedWrap).call(stacked);
      // focusStackedWrap.call(stacked);
//       
      var contextStackedWrap = g.select('.nv-context .nv-stackedWrap')
          .datum(data);
      //d3.transition(stackedWrap).call(stacked);
      contextStackedWrap.call(stacked2);
      

      //------------------------------------------------------------
      // Setup Main (Focus) Axes
      
        
      xAxis
        .scale(x)
        .ticks( availableWidth / 100 )
        .tickSize( -availableHeight1, 0);

      g.select('.nv-focus .nv-x.nv-axis')
          .attr('transform', 'translate(0,' + availableHeight1 + ')');
      //d3.transition(g.select('.nv-x.nv-axis'))
      g.select('.nv-focus .nv-x.nv-axis')
        .transition().duration(1000)
          .call(xAxis);

      yAxis
        .scale(y)
        .ticks(stacked.offset() == 'wiggle' ? 0 : availableHeight1 / 36)
        .tickSize(-availableWidth, 0)
        .setTickFormat(stacked.offset() == 'expand' ? d3.format('%') : yAxisTickFormat);

      //d3.transition(g.select('.nv-y.nv-axis'))
      g.select('.nv-focus .nv-y.nv-axis')
        .transition().duration(1000)
          .call(yAxis);

      //------------------------------------------------------------
 	 
 	 //------------------------------------------------------------
      // Setup Brush

      brush
        .x(x2)
        .on('brush', onBrush);

      if (brushExtent) brush.extent(brushExtent);

      var brushBG = g.select('.nv-brushBackground').selectAll('g')
          .data([brushExtent || brush.extent()])

      var brushBGenter = brushBG.enter()
          .append('g');

      brushBGenter.append('rect')
          .attr('class', 'left')
          .attr('x', 0)
          .attr('y', 0)
          .attr('height', availableHeight2);

      brushBGenter.append('rect')
          .attr('class', 'right')
          .attr('x', 0)
          .attr('y', 0)
          .attr('height', availableHeight2);

      gBrush = g.select('.nv-x.nv-brush')
          .call(brush);
      gBrush.selectAll('rect')
          //.attr('y', -5)
          .attr('height', availableHeight2);
      gBrush.selectAll('.resize').append('path').attr('d', resizePath);

      onBrush();

       //------------------------------------------------------------
      // Setup Secondary (Context) Axes

      x2Axis
        .scale(x2)
        .ticks( availableWidth / 100 )
        .tickSize(-availableHeight2, 0);

      g.select('.nv-context .nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y2.range()[0] + ')');
      // d3.transition(g.select('.nv-context .nv-x.nv-axis'))
          // .call(x2Axis);
   
      g.select('.nv-context .nv-x.nv-axis')
        .transition().duration(1000)
          .call(x2Axis);


      y2Axis
        .scale(y2)
        //.ticks( availableHeight2 / 36 )
        .ticks(stacked2.offset() == 'wiggle' ? 0 : availableHeight2 / 36)
        .tickSize( -availableWidth, 0)
        .setTickFormat(stacked2.offset() == 'expand' ? d3.format('%') : y2AxisTickFormat);

      
      g.select('.nv-context .nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y2.range()[0] + ')');
      
      // d3.transition(g.select('.nv-context .nv-y.nv-axis'))
          // .call(y2Axis);   
      g.select('.nv-context .nv-y.nv-axis')
        .transition().duration(1000)
          .call(y2Axis);

      //------------------------------------------------------------


      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      stacked.dispatch.on('areaDblClick.toggle', function(e) {
      	
      	console.log("areaDblClick.toggle e",e);
      	var idx=e.series.indexOf(":Big5");
      	
		if(!d3.event.ctrlKey)
      	//drill down
	        if (idx>0){
	        	var clicked_feature=e.series.substring(0,idx);
	        //Semetic drill down to level of facet
		        loadPersonalityOverTime(CURRENT_USER.id,clicked_feature,-1,-1, function (facets){	
			
					vizPersonalityOverTime(facets);					
				});
				
				//update the personality sunburst view:				
				d3.select("#sector_"+clicked_feature).call(function (d){										
					expandOrFoldSector(this.property("__data__"),d, false);
				});
				
				} 							else{
			//	       		if (data.filter(function(d) { return !d.disabled }).length === 1)
		          data = data.map(function(d) {
		            d.disabled = false;
		            return d
		          });
		        else
		          data = data.map(function(d,i) {
		            d.disabled = (i != e.seriesIndex);
		            return d
		          });
				 // Only update Main (Focus)
		        var focusStackedWrap = g.select('.nv-focus .nv-stackedWrap');
		        focusStackedWrap.call(stacked);
		        
		        var legendWrap = g.select('.nv-legendWrap');
		        legendWrap.call(legend);	
			}

        else
        //roll up
        {
        	if (idx<0){
        		//current level is facet, then roll up to trait level;
        	   loadPersonalityOverTime(CURRENT_USER.id,"big5",-1,-1, function (traits){	
			
					vizPersonalityOverTime(traits);				
	
				});
				//update the personality sunburst view:	
				d3.select("#sector_"+e.point.parent).call(function (d){										
					expandOrFoldSector(this.property("__data__"),d, false);
				});				
        	}
        }
       	       
      });

      legend.dispatch.on('legendClick', function(d,i) {
        d.disabled = !d.disabled;

        if (!data.filter(function(d) { return !d.disabled }).length) {
          data.map(function(d) {
            d.disabled = false;
            return d;
          });
        }

        //selection.transition().call(chart);
         chart(selection); //update both focus and context
       	
        
      });

      controls.dispatch.on('legendClick', function(d,i) {
        if (!d.disabled) return;

        controlsData = controlsData.map(function(s) {
          s.disabled = true;
          return s;
        });
        d.disabled = false;

        switch (d.key) {
          case 'Stacked':
            stacked.style('stack');
            stacked2.style('stack');
            break;
          case 'Stream':
            stacked.style('stream');
            stacked2.style('stream');
            break;
          case 'Silhouette':
            stacked.style('stream-center');
            stacked2.style('stream-center');
            break;
          case 'Expanded':
            stacked.style('expand');
            stacked2.style('expand');
            break;
        }

        //selection.transition().call(chart);
        chart(selection);
      });

      dispatch.on('tooltipShow', function(e,myClass) {
        if (tooltips) showTooltip(e, that.parentNode, myClass);
      });
      
      dispatch.on('scatterClick', function(e) {
      	 
            
          var data=e.series.values;
      	  var feature=e.series.key;//personality feature type
	      var start_time=-1, end_time=data[e.pointIndex][0];
	      if(e.pointIndex+1<data.length) start_time=data[e.pointIndex+1][0];
	      
	     // $("#data_loading_popup").dialog("open");
	      
	     showPersonalityWithAnalytics(CURRENT_USER.id,feature, start_time,end_time,"stackedArea");
	     
	     
	     $('#time_span_des').html(" [From "+d3.time.format('%x')(new Date(start_time))+" To "+d3.time.format('%x')(new Date(end_time))+ "]");
	    
	    //highlight the point of selected point 
	     d3.selectAll(' .nv-point').style("fill-opacity",null).style("stroke-width",null).style("stroke-opacity",null);
	     d3.select(' .nv-series-' + e.seriesIndex + ' .nv-point-' + e.pointIndex).style("fill-opacity",1).style("stroke-width",20).style("stroke-opacity",0.6);
         
         
          nv.tooltip.cleanup('nv-selected-hint');          
          e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
          dispatch.tooltipShow(e,'nv-selected-hint');
           
      });
      
     
      //============================================================
        
        
 	  //============================================================
      // Functions
      //------------------------------------------------------------

      // Taken from crossfilter (http://square.github.com/crossfilter/). It draws the left and rigt handler shap to drag for brushing
      function resizePath(d) {
        var e = +(d == 'e'),
            x = e ? 1 : -1,
            y = availableHeight2 / 3;
        return 'M' + (.5 * x) + ',' + y
            + 'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6)
            + 'V' + (2 * y - 6)
            + 'A6,6 0 0 ' + e + ' ' + (.5 * x) + ',' + (2 * y)
            + 'Z'
            + 'M' + (2.5 * x) + ',' + (y + 8)
            + 'V' + (2 * y - 8)
            + 'M' + (4.5 * x) + ',' + (y + 8)
            + 'V' + (2 * y - 8);
      }

     function updateBrushBG() {
        if (!brush.empty()) brush.extent(brushExtent);
        brushBG
            .data([brush.empty() ? x2.domain() : brushExtent])
            .each(function(d,i) {
              var leftWidth = x2(d[0]) - x.range()[0],
                  rightWidth = x.range()[1] - x2(d[1]);
              d3.select(this).select('.left')
                .attr('width',  leftWidth < 0 ? 0 : leftWidth);

              d3.select(this).select('.right')
                .attr('x', x2(d[1]))
                .attr('width', rightWidth < 0 ? 0 : rightWidth);
            });
      }
      
      
      function onBrush() {
        brushExtent = brush.empty() ? null : brush.extent();
        extent = brush.empty() ? x2.domain() : brush.extent();


        dispatch.brush({extent: extent, brush: brush});


        updateBrushBG();

        // Update Main (Focus)
        var focusStackedWrap = g.select('.nv-focus .nv-stackedWrap')
            .datum(
              data
                .filter(function(d) { return !d.disabled })
                .map(function(d,i) {
                  return {
                  	parent: d.parent,
                    key: d.key,
                    values: d.values.filter(function(d,i) {
                      return stacked.x()(d,i) >= extent[0] && stacked.x()(d,i) <= extent[1];
                    })
                  }
                })
            );
        //d3.transition(focusStackedWrap).call(stacked);
        focusStackedWrap.call(stacked);

        // Update Main (Focus) Axes
        // d3.transition(g.select('.nv-focus .nv-x.nv-axis'))
            // .call(xAxis);
        // d3.transition(g.select('.nv-focus .nv-y.nv-axis'))
            // .call(yAxis);
	      g.select('.nv-focus .nv-x.nv-axis')
	        .transition().duration(1000)
	          .call(xAxis);
          
	       g.select('.nv-focus .nv-y.nv-axis')
	        .transition().duration(1000)
	          .call(yAxis);
      }

      //============================================================
      
       

    });


    return chart;
  }

    


  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  stacked.dispatch.on('tooltipShow', function(e) {
    //disable tooltips when value ~= 0
    //// TODO: consider removing points from voronoi that have 0 value instead of this hack
    /*
    if (!Math.round(stacked.y()(e.point) * 100)) {  // 100 will not be good for very small numbers... will have to think about making this valu dynamic, based on data range
      setTimeout(function() { d3.selectAll('.point.hover').classed('hover', false) }, 0);
      return false;
    }
   */

    e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top],
    dispatch.tooltipShow(e);
  });

  stacked.dispatch.on('tooltipHide', function(e) {
    dispatch.tooltipHide(e);
  });

  dispatch.on('tooltipHide', function() {
    if (tooltips) nv.tooltip.cleanup();
  });
  
  stacked.dispatch.on('scatterClick', function(e) {
    dispatch.scatterClick(e);
    
  });

  //============================================================


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.dispatch = dispatch;
  chart.stacked = stacked;
  chart.stacked = stacked2;
  chart.legend = legend;
  chart.controls = controls;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;
  chart.x2Axis = x2Axis;
  chart.y2Axis = y2Axis;


  d3.rebind(chart, stacked, 'x', 'y', 'size', 'xScale', 'yScale', 'xDomain', 'yDomain', 'sizeDomain', 'interactive', 'offset', 'order', 'style', 'clipEdge', 'forceX', 'forceY', 'forceSize', 'interpolate');

  chart.x = function(_) {
    if (!arguments.length) return stacked.x;
    stacked.x(_);
    stacked2.x(_);
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return stacked.y;
    stacked.y(_);
    stacked2.y(_);
    return chart;
  };
  
  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };
  
  chart.margin2 = function(_) {
    if (!arguments.length) return margin2;
    margin2 = _;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return getWidth;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return getHeight;
    height = _;
    return chart;
  };
  
  chart.height2 = function(_) {
    if (!arguments.length) return height2;
    height2 = _;
    return chart;
  };
  
  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    legend.color(color);
    stacked.color(color);
    stacked2.color(color);
    return chart;
  };

  chart.showControls = function(_) {
    if (!arguments.length) return showControls;
    showControls = _;
    return chart;
  };

  chart.showLegend = function(_) {
    if (!arguments.length) return showLegend;
    showLegend = _;
    return chart;
  };

  chart.tooltip = function(_) {
    if (!arguments.length) return tooltip;
    tooltip = _;
    return chart;
  };

  chart.tooltips = function(_) {
    if (!arguments.length) return tooltips;
    tooltips = _;
    return chart;
  };

  chart.tooltipContent = function(_) {
    if (!arguments.length) return tooltip;
    tooltip = _;
    return chart;
  };

  chart.noData = function(_) {
    if (!arguments.length) return noData;
    noData = _;
    return chart;
  };

  yAxis.setTickFormat = yAxis.tickFormat;
  yAxis.tickFormat = function(_) {
    if (!arguments.length) return yAxisTickFormat;
    yAxisTickFormat = _;
    return yAxis;
  };
  
  y2Axis.setTickFormat = y2Axis.tickFormat;
  y2Axis.tickFormat = function(_) {
    if (!arguments.length) return y2AxisTickFormat;
    y2AxisTickFormat = _;
    return y2Axis;
  };
  
  
    // Chart has multiple similar Axes, to prevent code duplication, probably need to link all axis functions manually like below
  chart.xTickFormat = function(_) {
    if (!arguments.length) return xAxis.tickFormat();
    xAxis.tickFormat(_);
    x2Axis.tickFormat(_);
    return chart;
  };

  chart.yTickFormat = function(_) {
    if (!arguments.length) return yAxis.tickFormat();
    yAxis.tickFormat(_);
    y2Axis.tickFormat(_);
    return chart;
  };


  //============================================================

  return chart;
}
