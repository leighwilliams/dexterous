const Dexterous = require("../../dist/dexterous.js");
const dx = new Dexterous({trace:1,log:console});
dx.route(
  function matchPath(value) {
    const {request} = value;
    if(value.app.pathMatch("/hello",request.location.pathname)) {
      return {value};
    }
    return {done:true,value};
  }).use(
    value => {  
      value.response = new Response("at your service",{status:200,statusText:"ok"});
	    }
	  );
dx.use(
		function relay(value) {
			const {request} = value;
			value.response = fetch(request.location.href);
		}
);
dx.listen(self,{events:["fetch"]});



