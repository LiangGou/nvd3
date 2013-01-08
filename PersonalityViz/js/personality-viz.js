
         	
var colors = d3.scale.category20();

var Big5_Trait_Category_Map;
var Big5_Facet_Category_Map;

var LIWCCategory_To_Token_Map;
var LIWCToken_To_Category_Map;

var LIWCCategory_To_Snippet_Map;
var Snippet_To_LIWCCategory_Map;



var Active_Categories;
var Active_Category_Index_Map;
var Active_Tokens_Freq_Map;
var Active_Tweets;
var TweetID_Tweet_Map;

var colors5=["#1f77b4","#4AE750","#17becf","#fd8d3c","#9467bd"];

temporalChartColor = function(d, i) {
	
	var idx=d.key.indexOf(":Big5");
	if (idx>0){
		var trait=d.key.substring(0,idx);
		if(trait=="Openness") return colors5[0];
		if(trait=="Conscientiousness" ) return colors5[1];
		if(trait=="Extraversion") return colors5[2];
		if(trait=="Agreeableness" ) return colors5[3];
		if(trait=="Neuroticism" ) return colors5[4];		
	} else{
		var facet=d.key.substring(0,d.key.indexOf(":Facet"));
		
		if(d.parent=="Openness") return d3.rgb(colors5[0]).brighter((getIndexForFacet(d.parent,facet)-3)/3);
		if(d.parent=="Conscientiousness" ) return  d3.rgb(colors5[1]).brighter((getIndexForFacet(d.parent,facet)-3)/3);
		if(d.parent=="Extraversion") return  d3.rgb(colors5[2]).brighter((getIndexForFacet(d.parent,facet)-3)/3);
		if(d.parent=="Agreeableness" ) return  d3.rgb(colors5[3]).brighter((getIndexForFacet(d.parent,facet)-3)/3);
		if(d.parent=="Neuroticism" ) return  d3.rgb(colors5[4]).brighter((getIndexForFacet(d.parent,facet)-3)/3);
	}
	
};

sunburstColor=function(d){
	    
	var baseColor, coloridx=0;
         
    if (d.depth==1 || d.depth==0) 
     	coloridx=d.id;
    else 
     	coloridx=d.parent.id;
     	
    if(coloridx=="Openness") baseColor= colors5[0];
	if(coloridx=="Conscientiousness") baseColor= colors5[1];
	if(coloridx=="Extraversion") baseColor= colors5[2];
	if(coloridx=="Agreeableness") baseColor= colors5[3];
	if(coloridx=="Neuroticism") baseColor= colors5[4];   
    
    if (d.depth>1)     	
		return d3.rgb(baseColor).brighter((getIndexForFacet(d.parent.id,d.id)-3)/3);
	else 
		return baseColor;
}



function vizPersonalityTree(personality){
	
	var width = 400,
    height = 400,
    radius = Math.min(width, height) /1.8,
    color = d3.scale.category20();


	var angle_factor_increment=0.4;
		angle_factor_min=0.1; 
		
	var sector = twoArcsRender(radius);
		
	d3.select("#bigFive").select("svg").remove();
	
	var vis = d3.select("#bigFive").append("svg")
	    .attr("width", width)
	    .attr("height", height)
	    .attr("opacity",0.1)
	  .append("g")
	    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")") //center the graph of "g"
	    .append("g")
	    .attr("id","big5-main-group")
	    .call( d3.behavior.drag().on("drag", dragpanevent))
	    .call(d3.behavior.zoom().on("zoom", zoomevent)).on("dblclick.zoom", null);
	    
	d3.select("#bigFive").select("svg").transition().duration(500).attr("opacity",1);
	
	    var scale,
			translate={};
		function zoomevent() {
			if(!d3.event.sourceEvent.ctrlKey){
				//without pressing ctrl, then zoom
		    scale=d3.event.scale;
		    redraw(); 
		    } 
		}
		    
		function dragpanevent() {
			translate.x=d3.event.x;
			translate.y=d3.event.y;
			redraw();
		}
		
		function redraw() {
			var transformvalue="";
			if(translate.x!=null) transformvalue="translate(" + translate.x+","+translate.y + ")";
			if( scale!=null) transformvalue+="scale(" +scale + ")";
			vis.attr("transform",transformvalue);
		}
		
		//-------a function to format the personality data into tree------- 
		var partition = d3.layout.partition()
				    .sort(null)
				    .size([2 * Math.PI, radius])
				    .value(function(d) { return d.size; });
    
    	//----------------draw big 5--------------------
       var g = vis.data(personality).selectAll("g")
			      .data(partition.nodes)
			    .enter().append("g")
			    .attr("id", function(d) { return "sector_"+d.id; })
			    .attr("class", "sector")
			    .attr("visibility", function(d) { return d.depth==1 ? "visible" : "hidden"; }) // hide non-first level rings
			    .style("opacity",0.75)
			    .call(sector)
			    .each(stash)
			    .on("click", function (d){
			    	
			    	if(!d3.event.ctrlKey)
			    		expandOrFoldSector(d, d3.select(this),true);
			    	else 
			    		selectSector(d, d3.select(this),"sunburst");
			    	})
			    .call(d3.behavior.zoom().on("zoom", adjustSectorWidth))
			    .on('mouseover', function(d,i) {
	 			
	           		if (d3.select(this).style('opacity')==0.75) 
	           			d3.select(this).style('opacity',1);
	       	      
	         	 })
	          	.on('mouseout', function(d,i) {
	                
	           		if (d3.select(this).style('opacity')==1) 
	           			d3.select(this).style('opacity',0.75);
	           		
	      
	          	});
		
		//------------interaction functions--------------------	    
		function adjustSectorWidth(d) {
			//alert(d.name);
				
			if (!d.anglefactor) d.anglefactor=1;
			
			if (d3.event.sourceEvent.type == 'DOMMouseScroll' && d3.event.sourceEvent.ctrlKey) {
					//ctrl+mousewheel to adjust sector width				
					if (d3.event.sourceEvent.detail <0) 								
						//Increase angle
						
						d.anglefactor+=angle_factor_increment;
					 else 								
						//Decrease angle
					   d.anglefactor=(d.anglefactor-angle_factor_increment)> angle_factor_min ? d.anglefactor-angle_factor_increment: angle_factor_min;
			
					update_anglefactor(d, d.anglefactor);
					g.data(partition.value(function(a) { 			    	
			        		return a.size; 
			        	}))
			        .call(sector);
		 			
		     		 updateLabelLayout();					
			}
											
			
		}
   
	   
		
    
    vis.append("image")
	    .attr("width",100)
	    .attr("height", 100)
	    .attr("x", -50)
	    .attr("y", -50)    
	    .attr("xlink:href","img/user.png").on("dblclick.zoom", null);
      	
}

function selectSector(sector_d, ele, source){
	var feature_name;
	if (sector_d.depth==1) feature_name=sector_d.id+":Big5";
	if (sector_d.depth==2) feature_name=sector_d.id+":Facet";
		
	if(sector_d.selected==1) {
			 	    			
			 sector_d.selected=0;
			 d3.selectAll('.sector').style('opacity',null);

	} else {
			sector_d.selected=1;
				    				    			
			d3.selectAll('.sector').style('opacity',0.49);
		    ele.style("opacity",0.99);
		    
		    if (source!=null) if(source=="sunburst") 
			    d3.select("#sector_root").call(function (root){
					var d=this.property("__data__");
					showPersonalityWithAnalytics(d.user_id, feature_name, d.start_time,d.end_time,"sunburst");
						
				});
	 				
			}
	
}	
		
 // click expand or fold their children
function expandOrFoldSector(d, ele, fromSunburst) {

	
	
	if (d.expand!=null && d.depth>0){
		//ignore root node and first level sectors
	if (d.expand==0){
		//if the sector is folded
		
	     if(d.children) ele.style("opacity",0.4);
	  		 d3.select("#big5-main-group").selectAll("g").filter(function(a) {
				if (a.parent) 
					return  a.parent.id==d.id;
				})
	        	.attr("visibility","visible");
    		d.expand=1;
    		
	    	//drill down the temoral chart
	    	if (fromSunburst)  
	    		if (d.depth==1)
	    		// click on the trait sector, load new data to update the temporal view
	    			loadPersonalityOverTime(CURRENT_USER.id,d.id,-1,-1, function (facets){	
		
						vizPersonalityOverTime(facets);	
						nv.tooltip.cleanup('nv-selected-hint');	
					});
				else{
				// click on the facet sector, only filter to update the temporal view
		    	//TODO how to trigger a stacked.dispatch.on('areaDblClick.toggle',e)
		    	
	
				}
    	}
  	else{
  		//if the sector is expanded
  			
          if(d.children) ele.style("opacity",0.75);
	      hideSector(d);
	      //current level is facet, then roll up to trait level;
	  	  if (fromSunburst) loadPersonalityOverTime(CURRENT_USER.id,"big5",-1,-1, function (traits){	
		
					vizPersonalityOverTime(traits);	
					nv.tooltip.cleanup('nv-selected-hint');				

				});
      		}
      			      	
      	}
   }
   
   function hideSector(d){
		 d3.select("#big5-main-group").selectAll("g").filter(function(a) {
					if (a.parent) 
					return  a.parent.id==d.id;
					})
		        	.attr("visibility","hidden")
	        	.style("opacity",0.75)
	        	.each(function(a){
	        		if (a.children)
	        		hideSector(a);
	        	})
	        d.expand=0;
}
		

 // Recursively update the angle factor for leaf nodes.
function update_anglefactor(node, anglefactor) {
    var children = node.children;
        
    if (children && (n = children.length)) {
      var i = -1,
          n;
      while (++i < n) update_anglefactor(children[i], anglefactor);
    } else if (anglefactor) {
      node.anglefactor=anglefactor;
      if(!node.size0)
      node.size0=node.size;
      node.size=node.size0*anglefactor;
    }
}
			  
// Stash the old values for transition.
function stash(d) {
	  d.x0 = d.x;
	  d.dx0 = d.dx;
	  d.size0=d.size;
	  d.selected=0;
	  //set the expand flag
	  if (d.depth==0 ) 
	 	   d.expand=1;
	  else d.expand=0;
	  
}
 //used for label path
function reversedArc(start,end,r0 ) {
    var c0 = Math.cos(start),
        s0 = Math.sin(start),
        c1 = Math.cos(end),
        s1 = Math.sin(end);
    return "M" + r0 * c0 + "," + r0 * s0
      + "A" + r0 + "," + r0 + " 0" + " 0 , 0 " + r0 * c1 + "," + r0 * s1;
}
  
var sector_right_pad=0.02*2 * Math.PI,
    sector_bottom_pad=5.0;
//Render a sector with two adjcent arcs in a style of odometor
function twoArcsRender(radius) {

  // For each small multiple…
  function twoArcs(g) {
    g.each(function(d) {
    	 g = d3.select(this);
         g.selectAll("path").remove();
         g.selectAll("text").remove();
         
         var right_pad= d.depth>0 ? sector_right_pad/(3*d.depth): sector_right_pad;
                   	
	     var percentage=d.percentage;
	     var label="";
			
		 //if percentage is null, then give 1
		 if (percentage==null) percentage=1;
         
         if (d.depth==0) label=d.name;  
	     if (d.depth>0){
	       
	    		 if(percentage>=1) {percentage=0.99;
		         	console.log("Percentage is over 1!"+d.name);
		         } else if (percentage<=-1)
		 			{percentage=-0.99;
		         	console.log("Percentage is below -1!"+d.name);
		         }        		
	    		
	    			label=d.name+"("+(percentage*100).toFixed(2)+"%)";
	    		if ((Math.round(parseFloat(percentage)*100)/100)==0)  
	    			label=d.name;
	            	
	        }  
        
        //for request without any result
        if(d.name=="") { percentage=0;  label="";}
        	
        var arc1_extend=(Math.abs(percentage)*d.dx-right_pad)>0? (Math.abs(percentage)*d.dx-right_pad):0;	
        //Regular renders
         var arc1 = d3.svg.arc()
			    .startAngle(function(d) { return d.x; })//x:startangle,
			    .endAngle(function(d) { return d.x + arc1_extend; })//dx: endangle,
			    .innerRadius(function(d) { return sector_bottom_pad+d.y; })
			    .outerRadius(function(d) { return d.y + d.dy; });
			          
 		 var arc2 = d3.svg.arc()
			     .startAngle(function(d) { return d.x +arc1_extend; })//x:startangle,
			    .endAngle(function(d) { return d.x +d.dx-right_pad; })//dx: endangle,
			    .innerRadius(function(d) { return sector_bottom_pad+d.y; })
			    .outerRadius(function(d) { return d.y + d.dy; });
			    

  
		var arc_for_label;
		var arc_label_radius;
		if(d.depth==1 ) 
		
			arc_label_radius=d.y + d.dy-(d.y + d.dy-sector_bottom_pad-d.y)/6; 
		
		else 
			arc_label_radius= sector_bottom_pad+d.y+(d.y + d.dy-sector_bottom_pad-d.y)/2;
		
		
		if (d.x>2*Math.PI/3 && d.x<4*Math.PI/3) 
		//special reversed label for sector in lower part (angle large than 2PI/3)
          	arc_for_label=reversedArc(d.x + d.dx-right_pad-Math.PI/2, d.x-Math.PI/2, arc_label_radius);      
		else
			arc_for_label =  d3.svg.singleArc()
			   	.startAngle(function(d) {return d.x; })
			    .endAngle(function(d) { return d.x + d.dx-right_pad; })
			    .radius(function(d) { return d.depth==1? d.y + d.dy-(d.y + d.dy-sector_bottom_pad-d.y)/3: sector_bottom_pad+d.y+(d.y + d.dy-sector_bottom_pad-d.y)/3; });
	         
       
         
         var arc1color=sunburstColor(d);
                  	             
         //arc1color=d3.rgb(arc1color).brighter(Math.pow(1.1,(d.depth-2)*2));
         
         var strokecolor= d3.rgb(arc1color).darker(0.8);
         
       	if(!d.children){
	        	//leaf nodes
	           var label=d.name;
	           var bar_length_factor=1;
	        	
	           var percentage=d.percentage;	
			    
        	   var inner_r=sector_bottom_pad+d.y,
        		   out_r=sector_bottom_pad+d.y+bar_length_factor*Math.abs(percentage)*d.dy;
			   				
	    	   var _bar = d3.svg.arc()
					    .startAngle(d.x)
					    .endAngle(d.x + d.dx)
					    .innerRadius(inner_r)
					    .outerRadius(out_r);
			
				
				 g.append("path")
		          .attr("class", "_bar")
		          .attr("d", _bar)
		          .style("stroke", "#FFF")
		          .style("fill", arc1color)
		          .style("fill-opacity", 1 );
	               
		          //add leaf label;
		          
	          	var rotate=0,
					lbl_anchor="start",
					dy_init=0,
					label=d.name;
				
				if (d.x>Math.PI)
					{
						rotate=d.x*180/Math.PI+90;
						lbl_anchor="end";
						dy_init=-d.dx*20*Math.PI;
						
						}
				else {
						rotate=d.x*180/Math.PI-90;
						lbl_anchor="start";
							dy_init=5+d.dx*20*Math.PI;
					}
					
	        		
				var max_label_size=20, lable_size=12;
				
				if ((7.5+25*Math.PI*d.dx)>max_label_size) 			
					lable_size=max_label_size;
					
				label=label+"("+(percentage*100).toFixed(2)+"%)";
		           g.append("text")
				      .attr("dy", dy_init)
				      .attr("fill",d3.rgb(arc1color).darker(Math.pow(1.1,d.depth*2)))
				      .attr("font-size", lable_size)
				      .style("font-weight", "bold")
				      .attr("text-anchor", lbl_anchor)
				      .attr("transform", "translate("+(out_r+5)*Math.sin(d.x)+","+(-(out_r+5)*Math.cos(d.x))+") "+"rotate("+rotate+")") 
				      .text(label);
        	
        } else {   
         //        
		      var path1=g.append("path")
		          .attr("class", "arc1")
		          .attr("d", arc1)
		          .style("stroke", arc1color)
		          .style("fill", arc1color )
		          .style("fill-opacity", 0.7);
		         
		      	    
		       var path2= g.append("path")
		          .attr("class", "arc2")
		          .attr("d",arc2)
		          .style("stroke", strokecolor)
		      	  .style("fill", arc1color )
		      	  .style("fill-opacity", 0.15 );
		      	  
		      	   	//for social relation path
		      	if( d.children.length==0) 
		      	{
		      		path1.style("display", "none");
		      		path2.style("stroke-dasharray", "5,5");
		      	} else 
		      	    path2.style("stroke-opacity", 0.35);
		      	     
		      	 
      		   
				//draw label:
				//path used for label 	
				 g.append("path")
		          .attr("class", "arc_for_label")
		          .attr("id",function(d) { return d.id+".arc_for_label"; })
		          .attr("d", arc_for_label)
		          .style("stroke-opacity", 0)
		          .style("fill-opacity", 0 );
		          
		       
		         //add label 
			     g.append("text")
				   .attr("class","sector_label")
			       .attr("visibility", function(d) { return d.depth==1 ? "visible" : null; })
			       .attr("font-family","sans-serif")
			       .attr("fill", d3.rgb(arc1color).darker(2))
			       .append("textPath")
				       	.attr("class","sector_label_path")
				       	.attr("font-size", function(d) { return 22/Math.sqrt(d.depth+1)})
				        .attr("xlink:href", function(d) { return "#"+d.id+".arc_for_label"; })
				        .text(label);
	      	
      	}  
    });

  }

  return twoArcs;
};

   
function updateLabelLayout(){
	
	var max_font_size_base=23;
	var min_font_size_base=9;
	d3.selectAll('.sector_label_path').each(function(d){
		var curNd=d3.select(this).node();
		var text=d3.select(this).text();
		if(text) if(text.length>0)
		{
			
			var sector_length=(d.y+d.dy/3)*d.dx,
				text_length=curNd.getComputedTextLength();
				
			var cur_font_size=d3.select(this).attr("font-size");
			
			var new_font_size=cur_font_size*sector_length/text_length;
			
			
			if(new_font_size>max_font_size_base/(0.4*d.depth+0.6)) {
				
				new_font_size=max_font_size_base/(0.4*d.depth+0.6);
			
			}
			
			d3.select(this).attr("font-size",new_font_size);
				//set new offset:
			d3.select(this).attr("startOffset",(sector_length-curNd.getComputedTextLength())/2);
			
		}
						
    });
}


function vizPersonalityOverTime(personality_overtime){	   
	    
	      	
	    	nv.addGraph(function(data) {
				var height=345,width=1100;
				d3.select('#personality_temoral').remove();
				var	div=d3.select('#personality_temoral_div')
							.append('svg')
							.attr("id","personality_temoral")
							.attr("height",height)
							.attr("width",width);
				
				var chart = nv.models.stackedAreaWithFocusChart()
			                .x(function(d) { return d[0] })
			                .y(function(d) { return d[1] })
			                .width(width)
			                .height(height)
			                .color(temporalChartColor);	
			
				  chart.xAxis
				      .tickFormat(function(d) { return d3.time.format('%x')(new Date(d)) });
				  chart.x2Axis
				      .tickFormat(function(d) { return d3.time.format('%x')(new Date(d)) });
				
				  chart.yAxis
				      .tickFormat(d3.format(',.2f'));
				  chart.y2Axis
				      .tickFormat(d3.format(',.2f'));
				
				  div
				    .datum(personality_overtime)
				      .transition().duration(500).call(chart);
				
				  //nv.utils.windowResize(chart.update);		  
				
				  return chart;
			});
	    
	
}




function vizLIWCCategoryRank(feature){
    
    d3.select("#liwc_category_rank g").remove();
    var cateogry_rank_map,feature_name,idx;
    
    if((idx=feature.indexOf(":Big5"))>0)
    	cateogry_rank_map=Big5_Trait_Category_Map; 
    else
    
    if((idx=feature.indexOf(":Facet"))>0) 
    	cateogry_rank_map=Big5_Facet_Category_Map;
    
    feature_name =feature.substring(0,idx);

    
    var count=0;
    var vals;
    var active_categories=cateogry_rank_map.get(feature_name);
    Active_Category_Index_Map=d3.map();
    
	vals=active_categories.map(function (j){
    			var val=new Object();
    			val.x=count++;
    			val.y=j.percentage;
    			val.name=j.name;
				val.score=j.score; 
				
				return val;   		
    	});	
	vals.forEach(function (i){
		
		Active_Category_Index_Map.set(i.name,i.x);
		
	});
	
	//console.log("Active_Category_Index_Map",Active_Category_Index_Map);

	addVerticalBarGraph([
	    {
	      values: vals,
	      key: "LIWC_Category:"+feature_name,
	      color: "#ff7f0e"
	    }
	  ]);
	  
	return active_categories;
}

    
function addVerticalBarGraph(data){
	/* data format:
	 [
	    {
	      values: [{x:i,y:value}...],
	      key: "Sine Wave",
	      color: "#ff7f0e"
	    }
	  ];*/
	nv.addGraph({
	  generate: function() {
	    var width = 350,
	        height = 290;
	
	    var chart = nv.models.verticalBar()
	        .padData(true)
	        .width(width)
	        .height(height)
	        .color(categoryColor);
	
	    d3.select("#liwc_category_rank")
	      .attr('width', width)
	      .attr('height', height)
	      .attr('opacity',0)	      
	      .datum(data)
	      .call(chart);
	    d3.select("#liwc_category_rank").transition()
	      .duration(500)
	      .attr('opacity',1);
	
	    return chart;
	  },
	  callback: function(graph) {
	
	    graph.dispatch.on('elementMouseover', function(e) {
	    	
	        var offsetElement = document.getElementById("chart"),
	                left = e.pos[0],
	                top = e.pos[1];
	
	                
	        var content = '<h3>' + e.point.name + '</h3>' +
	                '<p>' +
	                e.point.score +
	                '</p>';
	              
			
			//todo: fix the position;
	        nv.tooltip.show([600,800], content, e.value < 0 ? 'n' : 's');
	    });
	
	    graph.dispatch.on('elementMouseout', function(e) {
	        nv.tooltip.cleanup();
	    });
	
	    
	    graph.dispatch.on('elementClick', function(e) {
	    	//alert(e.data.name);
	    	if(e.bar.attr('selected')==null) {
	    		
	    		d3.selectAll('.nv-bar').attr('selected','false').style('fill-opacity',0.1);
	    		e.bar.attr('selected','true').style('fill-opacity',1);

	    		//hightlight word cloud and tweets
	    		 highlightWordCloud([e.data]);
	    		 highlightTweetSnippet([e.data]);
	    		 
	    		}
	    	else {
	    		if(e.bar.attr('selected')=='true') {
	    			 
	    			
	    			 e.bar.attr('selected','false');
	    			 d3.selectAll('.nv-bar').style('fill-opacity',null);
	    			  //Unhightlight word cloud and tweets
	    			 d3.select("#keyword_cloud_div svg").selectAll('text')
	 						.style('fill-opacity',0.75)
	 				 d3.selectAll(".tweets_legend_div")
	 						.style('opacity',0.75);
	 			     d3.selectAll(".div_with_close")
	 						.style('display',null);		
	 						
	    	} else {
	    			
	    			
	    			d3.selectAll('.nv-bar').attr('selected','false').style('fill-opacity',0.1);
	    		    e.bar.attr('selected','true').style('fill-opacity',1);
	 					//hightlight word cloud and tweets
	    			  highlightWordCloud([e.data]);
	    			  highlightTweetSnippet([e.data]);
	    			}
	    	}
   
	    });
	
	  }
	});


}

function categoryColor(d,i){
	//console.log("d.x",d.x);	
	
	var cate_colors = colors.range();    
    return cate_colors[d.x % cate_colors.length];
}


function getWordCategoryColor(d){
	//console.log("token",d.text);
	//get the dorminant category for each token:
	var dominant_cate;
	var cates=LIWCToken_To_Category_Map.get(d.text);//the cates have been sorted by frequence
	
	//console.log("cates",cates);
	
	for (var i=0;i<cates.length;i++){
		//check if the current cate is in the active cates of selection 			
		for (var j=0;j<Active_Categories.length;j++)
			if (Active_Categories[j].name==cates[i].name) {
				dominant_cate=cates[i].name;//found
				break;
				}			
		if (dominant_cate!=null) break;
	}
				
	//console.log("get cate key",dominant_cate);
	var idx=Active_Category_Index_Map.get(dominant_cate);
	//console.log("get cate index",idx);
	var cate_colors = colors.range();    
    return cate_colors[idx % cate_colors.length];
}

function colorCodeTokenInTweet(tweet){
	//simple tokenizer
	
	var results=tweet;
	var tokens = tweet.match(/\w+/g);
	
	var uniqueTokens = [];
		$.each(tokens, function(i, el){
		    if($.inArray(el, uniqueTokens) === -1) uniqueTokens.push(el);
		}); 
	//
	
	for (var i=0;i<uniqueTokens.length;i++)
			if (Active_Tokens_Freq_Map.get(uniqueTokens[i])!=null){
				
				var d=new Object();
				d.text=uniqueTokens[i];
				var color=getWordCategoryColor(d);
				
				var colored_token='<span style="color:'+getWordCategoryColor(d)+'; font-weight:bold">'+d.text+'</span>';	
				
				if(d.text=="a"
				 ||d.text=="an"
				 ||d.text=="on"
				 ||d.text=="i"
				 ||d.text=="to"
				 ||d.text=="me"
				 ||d.text=="the"
				 ||d.text=="no")
				 {
				    d.text=" "+d.text+" ";
				    var re = new RegExp(d.text,"g");
				    results=results.replace(re,"&nbsp;"+colored_token+"&nbsp;");
				    }
				 else
				 if(d.text=="I"
				 ||d.text=="My"
				 ||d.text=="The"
				 ||d.text=="To"
				 ||d.text=="On")
				 {
				    d.text=d.text+" ";
				    var re = new RegExp(d.text,"g");
				    results=results.replace(re,colored_token+"&nbsp;");
				    }
				 else
				results=results.replace(new RegExp(d.text,"g"),colored_token);
				
				// if (tweet.indexOf("Seattle Supersonics name came from the")>0) {
					// console.log("tweet",tweet);
					// console.log("colored_token",colored_token);
					// console.log("results",results);
				// }
				
			}
				
			
	return results;		
}

var Word_Cloud_Font_Base_Size=15;
	
function vizWordCloud(categories){
	
	var token_frq=d3.map();
	categories.forEach(function (cate){
		var tokens=LIWCCategory_To_Token_Map.get(cate.name);
		tokens.forEach(function (tk){
			var feq=token_frq.get(tk.name);
			if(feq==null){
				token_frq.set(tk.name,tk.score);
			}else{
				token_frq.set(tk.name,tk.score+feq);
			}
		})
	});
		
	
	 d3.select("#keyword_cloud_div svg").remove();
	 
	 addWordCloud(
			token_frq.entries().map(function (d){				

				return {text: d.key, size:Word_Cloud_Font_Base_Size+2*d.value};
			})
	 	 );
	return token_frq;
}

function addWordCloud(data){
	  //console.log("word data",data);
	  var fill = d3.scale.category20();
	  var div=d3.select("#keyword_cloud_div");
	  var height=400, width=385;//div.attr("width");
	  
	  
	  d3.layout.cloud().size([width, height])
	      .words(data)
	      .timeInterval(50)
	      .rotate(function() { return ~~(Math.random() * 2) * 90; })
	      .font("Impact")
	      .fontSize(function(d) { return d.size; })
	      .on("end", draw)
	      .start();
	
	  function draw(words) {
	    d3.select("#keywords_cloud").append("svg")
	        .attr("width", width)
	        .attr("height", height)
	      .append("g")
	        .attr("transform", "translate("+width/2+","+height/2+")")
	      .selectAll("text")
	        .data(words)
	      .enter().append("text")
	        .style("font-size", function(d) { return d.size + "px"; })
	        .style("font-family", "Impact")
	        .style("fill",getWordCategoryColor)
	        .style('fill-opacity',0.75)
	        .attr('class', 'word_cloud')
	        .attr("text-anchor", "middle")
	        .attr("transform", function(d) {
	          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
	        })
	        .attr("id", function(d) { return d.text; })
	        .text(function(d) { return d.text; })	        
	 		.on('mouseover', function(d,i) {
	 			
           		if (d3.select(this).style('fill-opacity')==0.75) 
           			d3.select(this).style('fill-opacity',1);
           		
         	 })
          	.on('mouseout', function(d,i) {
                
           		if (d3.select(this).style('fill-opacity')==1) 
           			d3.select(this).style('fill-opacity',0.75);
           		
      
          	});
	  }
	
}

function highlightWordCloud(categories){
	
	var token_frq=d3.map();
	categories.forEach(function (cate){
		var tokens=LIWCCategory_To_Token_Map.get(cate.name);
		tokens.forEach(function (tk){
			var feq=token_frq.get(tk.name);
			if(feq==null){
				token_frq.set(tk.name,tk.score);
			}else{
				token_frq.set(tk.name,tk.score+feq);
			}
		})
	});
	
	
	 d3.select("#keyword_cloud_div svg").selectAll('text')
	 	.style('fill-opacity',0.1)
	 	.filter(function(a) {
			return  (token_frq.get(a.text)!=null);
		   })
	    .style('fill-opacity',1);
}
function getTweetCategoryColor(d){
	
	//get the dorminant category for each token:
	var dominant_cate;
	var cates=Snippet_To_LIWCCategory_Map.get(d.key);//the cates have been sorted by frequence
	
	//console.log("cates",cates);
	
	for (var i=0;i<cates.length;i++){
		//check if the current cate is in the active cates of selection 			
		for (var j=0;j<Active_Categories.length;j++)
			if (Active_Categories[j].name==cates[i].name) {
				dominant_cate=cates[i].name;//found
				break;
				}			
		if (dominant_cate!=null) break;
	}
				
	//console.log("get cate key",dominant_cate);
	var idx=Active_Category_Index_Map.get(dominant_cate);
	//console.log("get cate index",idx);
	var cate_colors = colors.range();    
    return cate_colors[idx % cate_colors.length];
}

function vizTweetSnippet(categories){
	
	var snippet_frq=d3.map();
	categories.forEach(function (cate){
		var snippets=LIWCCategory_To_Snippet_Map.get(cate.name);
		snippets.forEach(function (tk){
			var feq=snippet_frq.get(tk.name);
			if(feq==null){
				snippet_frq.set(tk.name,tk.score);
			}else{
				snippet_frq.set(tk.name,tk.score+feq);
			}
		})
	});
	
	//  console.log("token_frq.entries",token_frq.entries());
	 
	 d3.select("#tweets_icon").transition().duration(250).style("opacity",0).remove();//
	 var div_icons=d3.select("#tweets_icon_wraper").append("div").attr("id","tweets_icon").style("display","inline-block");
	 div_icons.selectAll(".tweets_legend_div")
	 	.data(snippet_frq.entries())
	 	.enter()
	 		.append('div')
	 		.attr('class','tweets_legend_div')
	 		.attr('id',function (d){ return 'tweet_icon_'+d.key;})
	 		.attr("onclick",function (d){ return "showTweets('"+d.key+"')";})
	 		.attr("title",function (d){ return d.key;})
	 		.style('background-color',getTweetCategoryColor)
	 		.on('mouseover', function(d,i) {
	 			
           		if (d3.select(this).style('opacity')==0.75) 
           			d3.select(this).style('opacity',1);
           		
      
         	 })
          	.on('mouseout', function(d,i) {
                
           		if (d3.select(this).style('opacity')==1) 
           			d3.select(this).style('opacity',0.75);
           		
      
          	})
	 		.transition().delay(function (d,i){ return 250+i*25;}).duration(25).style("opacity",0.75);
	 	
	 $('#tweet_snippet').empty();
	 
	 //show first 10 tweets:
	 var entries=snippet_frq.entries();
	 //console.log("token_frq.entries",entries);
	for(var i=0;i<Math.min(100,entries.length);i++){
		
		showTweets(entries[i].key);
	} 
		
}

function highlightTweetSnippet(categories){
	
	var snippet_frq=d3.map();
	categories.forEach(function (cate){
		var snippets=LIWCCategory_To_Snippet_Map.get(cate.name);
		snippets.forEach(function (tk){
			var feq=snippet_frq.get(tk.name);
			if(feq==null){
				snippet_frq.set(tk.name,tk.score);
			}else{
				snippet_frq.set(tk.name,tk.score+feq);
			}
		})
	});
	
	

    d3.selectAll(".tweets_legend_div")
	 	.style('opacity',0.1)
	 	.filter(function(d) {
	 		//alert(d.key);
			return  (snippet_frq.get(d.key)!=null);
		   })
	    .style('opacity',1);
	    
	  d3.selectAll(".div_with_close")
	 	.style('display','none')
	 	.filter(function(d) {
	 		var id_string=d3.select(this).attr('id');
	 		var id=id_string.substring('tweet_snippet_'.length,id_string.length);
	 		//console.log('id',id);
			return  (snippet_frq.get(id)!=null);
		   })
	    .style('display',null);	
}

function showTweets(tweet_id){
	
	var tweet;
	if (TweetID_Tweet_Map!=null){
		//console.log("tweet_id to show",tweet_id);
			//$('#tweet_snippet').empty();
		       //console.log("TweetID_Tweet_Map",TweetID_Tweet_Map);
			tweet=TweetID_Tweet_Map.get(tweet_id);
			if (tweet!=null){
				
				var htm_usertweets = '<div id="TWEET_ID" class="div_with_close">'+
				'<a style="float:right; padding-left: 22px;  background: url(img/close.png) 0px 0px no-repeat;" onclick="MY_FUNCTION">&nbsp;</a>'+
				'<div class="text_time" style="	-moz-box-shadow: 0 0 10px #CCC;	-webkit-box-shadow: 0 0 10px #CCC;	box-shadow: 0 0 10px #CCC;">'+
				'<span class="text"> TWEET_TEXT </span><span class="time">AGO</span> </div></div>';
				
				//color the tokens
				var	token_colored_text=colorCodeTokenInTweet(tweet.text);
				
				var text = Ify.clean(token_colored_text);			
				
	
				$('#tweet_snippet').append(htm_usertweets.replace('TWEET_ID','tweet_snippet_'+tweet_id).replace(/#CCC/g,d3.select("#tweet_icon_"+tweet_id).style('background-color')).replace('MY_FUNCTION',"removeTweetSnippet('"+tweet_id+"')").replace('TWEET_TEXT', text).replace('AGO', '<a href="http://twitter.com/' + tweet.user.screen_name + '/statuses/' + tweet.id_str + '">' + relative_time(tweet.created_at) + '</a>'));
			} else 
			console.log("Tweet not found!"+tweet_id);
	}
}

function removeTweetSnippet(id){
	d3.select("#tweet_snippet_"+id).remove();
}
function convertToMap(array){
	var mp=d3.map();
	array.forEach(function (i){
		mp.set(i.key,i.value);
	});
	return mp;
}
 function showPersonalityWithAnalytics(user_id,feature,start_time,end_time, source){
	      
		  loadPersonalityAnalyticsAtTime(user_id, start_time,end_time, function (p_analytics){
				
				//----store get all map data----
				
				Big5_Trait_Category_Map=convertToMap(p_analytics.big5_trait_category);
				Big5_Facet_Category_Map=convertToMap(p_analytics.big5_facet_category);
				
				LIWCCategory_To_Token_Map=convertToMap(p_analytics.liwcCategory_to_token);
				LIWCToken_To_Category_Map=convertToMap(p_analytics.liwcToken_to_category);
				
				LIWCCategory_To_Snippet_Map=convertToMap(p_analytics.liwcCategory_to_snippet);
				Snippet_To_LIWCCategory_Map=convertToMap(p_analytics.snippet_to_liwcCategory);
				
				
			//	console.log("LIWCCategory_To_Token_Map",LIWCCategory_To_Token_Map);
				
				if (source!="sunburst") {
					
					  vizPersonalityTree([p_analytics.big5_tree]);
					
					 //TODO: hightlight current feature of selection in the sunburst view:
			          // var idx;
			           // if(feature.indexOf(":Big5")>0)
					    	// idx=feature.indexOf(":Big5"); 
					    // else
					    	// idx=feature.indexOf(":Facet");		    	
			          // d3.select("#sector_"+feature.substring(0,idx)).call(function (tmp){	          	
			          	// 
			          	// selectSector(this.property("__data__"), this);
			          // }) 	          			          
          		}
				
				
				
				// visualize evidence
				Active_Categories=vizLIWCCategoryRank(feature);
						
				Active_Tokens_Freq_Map=vizWordCloud(Active_Categories);
					
				loadTweetsAtTime(user_id,start_time,end_time, function (tweets){
					Active_Tweets=tweets;
					
					TweetID_Tweet_Map=d3.map();
					
					tweets.tweets.forEach(function (twt){
						TweetID_Tweet_Map.set(twt.id_str,twt);
					});
										
					vizTweetSnippet(Active_Categories);
					
				});
				
				
				
				
		});
		

		//
	}
			
function vizPersonality(user_id){
	
	loadUserTwitter(user_id,function(twitters){ });//from dataprocess.js
	loadCurrentPersonality(user_id,function(cur_personality){		
		
		vizPersonalityTree(cur_personality);	
	
	});
	
	loadPersonalityOverTime(user_id,"big5",-1,-1, function (data){	
		
		vizPersonalityOverTime(data);
		
		}); 
	
	
	
	

}

		