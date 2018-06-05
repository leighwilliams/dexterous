const Dexterous = require("../../dist/dexterous.js");
const dx = new Dexterous({trace:1,log:console});
dx.route(
	  function matchPath(value) {
	    const {target} = value;
	    if(value.app.pathMatch("/hello",target.pathname)) {
	    	value.preventDefault();
	      return {value};
	    }
	    return {done:true,value};
	  }).use(
	    value => {  
	      alert("at your service")
		    }
		  );
dx.listen(window,{events:["click"]});



