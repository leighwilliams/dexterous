const Dexterous = require("../../dist/dexterous.js"),
	dx = new Dexterous({trace:1,log:console});
dx.route("/hello").use(
  value => new Response("at your service",{status:200,statusText:"ok"})
  );
dx.use(
		({request:{location:href}}) => fetch(href)
);
dx.listen(self,{events:["fetch"]});



