define("raphaelext", ['raphael'], function(){
	Raphael.fn.connection = function (obj1, obj2, line, bg) {
	    if (obj1.line && obj1.from && obj1.to) {
		line = obj1;
		obj1 = line.from;
		obj2 = line.to;
	    }
	    var bb1 = obj1.getBBox(),
		bb2 = obj2.getBBox(),
		p = [{x: bb1.x + bb1.width / 2, y: bb1.y - 1},
		{x: bb1.x + bb1.width / 2, y: bb1.y + bb1.height + 1},
		{x: bb1.x - 1, y: bb1.y + bb1.height / 2},
		{x: bb1.x + bb1.width + 1, y: bb1.y + bb1.height / 2},
		{x: bb2.x + bb2.width / 2, y: bb2.y - 1},
		{x: bb2.x + bb2.width / 2, y: bb2.y + bb2.height + 1},
		{x: bb2.x - 1, y: bb2.y + bb2.height / 2},
		{x: bb2.x + bb2.width + 1, y: bb2.y + bb2.height / 2}],
		d = {}, dis = [];
	    for (var i = 0; i < 4; i++) {
		for (var j = 4; j < 8; j++) {
		    var dx = Math.abs(p[i].x - p[j].x),
			dy = Math.abs(p[i].y - p[j].y);
		    if ((i == j - 4) || (((i != 3 && j != 6) || p[i].x < p[j].x) && ((i != 2 && j != 7) || p[i].x > p[j].x) && ((i != 0 && j != 5) || p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
			dis.push(dx + dy);
			d[dis[dis.length - 1]] = [i, j];
		    }
		}
	    }
	    if (dis.length == 0) {
		var res = [0, 4];
	    } else {
		res = d[Math.min.apply(Math, dis)];
	    }
	    var x1 = p[res[0]].x,
		y1 = p[res[0]].y,
		x4 = p[res[1]].x,
		y4 = p[res[1]].y;
	    dx = Math.max(Math.abs(x1 - x4) / 2, 10);
	    dy = Math.max(Math.abs(y1 - y4) / 2, 10);
	    var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
		y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
		x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
		y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);
	    var path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)].join(",");
	    
	    var size = 5; //image size in px
	    triangle =  ["M", x4, y4, "L", (x4  - size),(y4  - size),"L" ,(x4  - size),(y4  + size),"L",x4 ,y4];
	    var angle = ((bb2.x+bb2.width)<bb1.x) ? 180 : ((bb2.x>bb1.x+bb1.width) ? 0 : ((bb2.y<bb1.y)?270:90));
	    
	    
	    
	    if (line && line.line) {
		line.bg && line.bg.attr({path: path});
		line.line.attr({path: path});
		line.tri.attr({path: triangle});
		line.tri.transform("r"+angle);
	
	    } else {
		var color = typeof line == "string" ? line : "#000";
		return {
		    bg: bg && bg.split && this.path(path).attr({stroke: bg.split("|")[0], fill: "none", "stroke-width": bg.split("|")[1] || 3}),
		    line: this.path(path).attr({stroke: color, fill: "none"}),
		    tri: this.path(triangle).attr({stroke: color,"fill":"#000"}), 
		    remove : (function(){				
				   if (this && this.line) {					   
					this.line.remove();
					this.tri.remove();
				   }
				}),
		    from: obj1,
		    to: obj2
		};
	    }
	};
	
	Raphael.fn.getCanvas = function(){
		return this.canvas;
	};
	
	Raphael.fn.bind = function(eventType, definition){
		$(this.getCanvas()).bind(eventType, definition);
	};
	
	//Update the element current position when is dragger into the canvas
	Raphael.fn.dragger = function () {
		this.ox = this.type == "ellipse" ? this.attr("cx") : this.attr("x");
		this.oy = this.type == "ellipse" ? this.attr("cy") : this.attr("y");
		
		this.animate({"fill-opacity": .2}, 500);
	};
	
    Raphael.fn.up = function () {
		this.animate({"fill-opacity": 0}, 500);
    };
	
	Raphael.fn.moveShape = function (context) {	
	    return function(dx, dy){
		var att = this.type == "ellipse" ? {cx: this.ox + dx, cy: this.oy + dy} : {x: this.ox + dx, y: this.oy + dy};
		
		//if the element is part of a complex system, we hat o propagate for all element in the parent
		if(this.elements){
			this.elements.forEach(function (el) {
				el.attr(att);
				if(el.getTransform()) el.transform(el.getTransform());			
			});
		}
		this.attr(att); // if no parent is defined, set the current coords for the current element 
		
		var connections = context.connections;		
		for (var i = connections.length; i--;) {
		    context.paper.connection(connections.at(i).el);
		}
		context.paper.safari();
	    }
        };
	
	Raphael.fn.shape = function(url, x, y, width, height, context, definition){
		var shapeEl = context.paper.image(url, x, y, width, height);
		
				//enabling drag events only on the palette element
		shapeEl.drag(context.paper.moveShape(context), context.paper.dragger, context.paper.up);
		
		shapeEl.mouseover(function(ev){
			this.elements.forEach(function (el) {					
				if(el.isHideable()) el.transform(el.getTransform());			
				clearTimeout(el.timeout);////clear a potential pending timeout event
				el.show();	
				
			});
			//if(context.arrowActive.active) this.animate({"opacity": .4}, 800); //when the element is selected
		});
			
		shapeEl.mouseout(function(ev){
			this.elements.forEach(function (el) {
				if(el.isHideable()) el.timeout = setTimeout(function(el){el.hide()},2000,el);
			});
			//if(context.arrowActive.active) this.animate({"opacity": 1}, 200);
		});
			
		//click event binding on shape element
		shapeEl.mousedown(definition(context, shapeEl));	

		//dbclick event binding
		shapeEl.setDblclick = function(definition){
			shapeEl.dblclick(definition(context, shapeEl));
		};
		
		shapeEl.elements = context.paper.set();
		
		return shapeEl;
	};

	//add a menu related to a canvas element
	Raphael.fn.shapeMenu = function(uri, x, y, width, height,imgWidth, context, definition){

		var element = context.paper.image(uri, x, y, width, height);//"img/arrow.png", shape.x, shape.y, 21, 25);	

		element.mousedown(definition(context));
		
		element.mouseover(function(ev){			
			clearTimeout(this.timeout);
		});
		
		element.mouseout(function(ev){			
			this.timeout = setTimeout(function(el){el.hide()},2000,this);
		});
		
		element.hideable = true;
		element.isHideable = function(){
			return true;
		};
		element.hide();

		element.getTransform = function(){
			return "t"+imgWidth+",-10";
		};
		
		return element;
	};

	Raphael.fn.shapeText = function(text, x, y, shapeEl, context){
		
		var element = context.paper.text(x,y, text);
		element.attr({"transform" : "t"+shapeEl.attrs['width']/3+",0"});
		//Raphael Bug #491. Works on IE ?
		$('tspan', element.node).attr('dy', -8);

		//refresh the default attribute in the canvas
		$(shapeEl).on("propsChanged", 
					function(ev, name, value){					
						if(name =='id'){
							element.attr({text : text+': '+value});
							if(element.getTransform()) element.transform(element.getTransform());			
						}
					}
		);

		element.hideable = false;
		element.isHideable = function(){
			return false;
		};

		element.getTransform = function(){
			return "t"+shapeEl.attrs['width']/3+",-10";
		};
				
		return element;
	};
	
	Raphael.fn.wrap = function(context, targetId, definition){
		return definition
	},

	Raphael.fn.menu = function (itemList){
		var raphael = setted().getRaphael();	
		this.box = raphael.rect(0,0,100,50);
		this.boxtext = raphael.text(60,20,"Add arrow");
		this.boxtext.type = 'text';
		this.boxtext.click(function(){
						var editor = setted();
						editor.arrowActive.pending = true;
						editor.arrowActive.source = editor.active;
					}
		);
		this.box.attr({fill:'grey'});
		this.el = raphael.set();
		this.el.attr({zIndex : '99999'});;
		this.el.push(this.box);
		this.el.push(this.boxtext);
		this.el.hide();
		this.el.parentShow = this.el.show;
		
		this.el.show = function(posx,posy){		
			posx = posx -260;
			posy = posy + 20;
			this.forEach(function(el){
				
				if(el.type == 'text')
					el.attr({x:posx+30,y:posy+10});
				else  el.attr({x:posx,y:posy});
				}
			);
			
			this.parentShow();
		};
		
		raphael.safari();
		
		return this.el;
	};
	
	return Raphael;
});