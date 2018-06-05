  createReactiveModel(initial={},render) {
    	const watching = {};
    	render || (render=this.render);
    	return new Proxy(Object.assign({},initial),{
    		get(target,key) {
    			if(key==="watch") {
    				return (key,view) => { // need to make these keys . notation
    	    			watching[key] || (watching[key]=[]);
    	    			watching[key].push(view);
    	    		}
    			}
    			return target[key];
    		},
    		set(target,key,value) {
    			const watched = watching[key];
    			target[key] = value;
    			if(watched) {
    				watched.forEach((view) => {
    					render(view,target);
    				});
    			}
    			return true;
    		}
    	});
    }

render(view,model=view.model) { // ,partials={}
    	const me = this,
    		watch = new Map();
    	let elements;
    	function callback(e) {
    		e = window.e || e;
    		const key = watch.get(e.target);
    		if(key) {
        		console.log(e);
    			model[key] = e.target.value;
    		}
    	}
    	//if(view.addEventListener) {
    	//	view.addEventListener("change", callback);
    	//}
    	if(view instanceof Document) {
    		elements = view.getElementsByTagName("*");
    	} else {
    		elements = document.querySelectorAll(view.selector);
    	}
    	for(let i=0;i<elements.length;i++) {
    		const element = elements[i];
    		if(element.childNodes.length>1) { continue; }
    		let template, templatekeys;
    		if(view.template) {
    			//	 Can we do partials {{> }}  ... replace {{> name }} with "name"
    			template = view.template.replace(/\{\{/g,"${").replace(/\}\}/g,"}");
    			templatekeys = view.template.match(/(?<=\{\{).+?(?=\}\})/g);
    		} else if(element.childNodes.length===1){
    			if(!/(?<=\{\{).+?(?=\}\})/g.test(element.innerHTML)) { continue; }
    			template = element.innerHTML.replace(/\{\{/g,"${").replace(/\}\}/g,"}");
    			templatekeys = element.innerHTML.match(/(?<=\{\{).+?(?=\}\})/g);
    			if(!templatekeys) continue;
    			me.templates.set(element,template);
    		} else {
    			if(!/(?<=\{\{).+?(?=\}\})/g.test(element.outerHTML)) { continue; }
    			template = element.outerHTML.replace(/\{\{/g,"${").replace(/\}\}/g,"}");
    			templatekeys = element.outerHTML.match(/(?<=\{\{).+?(?=\}\})/g);
    			if(!templatekeys) continue;
    			me.templates.set(element,template);
    		}
    		templatekeys.forEach((key) => {
    			model.watch(key,element);
    		});
    		const keys = Object.keys(model),
    			variables = keys.join(","),
    			values = keys.map((item) => "this." + item).join(",");
    		try {
    			const html = new Function("return function(" + variables + ") { return `" + template + "` }.call(this," + values + ");").call(model);
      			if(element.childNodes.length===1) {
    				element.innerHTML = html;
    			} else {
    				element.outerHTML = html;
    			}
      			if(element.addEventListener) {
      	    		element.addEventListener("change", function(event) { console.log(event); });
      	    	}
    		} catch(e) {
    			console.log("Malformed template: ",template);
    			console.log("Scope: ",model);
    			console.log(e);
    		}
    		if(typeof(view.sideffect)==="function") {
    			view.sideffect.call(element);
    		}
    	};
    }