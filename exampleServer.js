const Dexterous = require("./dexterous"),
	server = new Dexterous.Server(undefined,{secure:false,traceLevel:0});
// modify requests and responses
server.use(require("./handlers/MethodQueryString")());
server.use(require("./handlers/URLContentType")());
server.use(require("./handlers/JSONParser"));
server.use(require("./handlers/watch")(server,"/examples/Watch")); // should always go after DefaultFile handler

// return dynamic content
server.use(require("./handlers/JavaScriptRunner")({},true));
server.use(require("./handlers/REST")("/REST/test/",{
	get: (id,request,response,next) => {
		if(id) {
			response.end("GET with id: " + id);
		}
	},
	post: (id,request,response,next) => {
		if(request.body) {
			if(id) {
				request.body.id = id;
				response.end("POST with id: " + id  + (request.body ? " and with body " + JSON.stringify(request.body) : ""));
			} else { 
				request.body.id = Math.round(Math.random()*1000);
				response.end("POST without id (server assigned)" + (request.body ? " and with body " + JSON.stringify(request.body) : ""));
			}
		}
	},
	put: (id,request,response,next) => {
		if(request.body && id) {
			response.end("PUT with id: " + id  + (request.body ? " and with body " + JSON.stringify(request.body) : ""));
		}
	},
	delete: (id,request,response,next) => {
		if(id) {
			response.end("DELETE with id: " + id);
		}
	}
}));

// handle static content
server.use(require("./handlers/DefaultFile")("index.html"));
server.use(require("./handlers/static")("/examples"));

server.listen(3000,"127.0.0.1").then(() => {
	const client = new Dexterous.Client();
	client.use(require("./handlers/JSONParser.js"));
	client.listen(3000,"127.0.0.1").then(() => {
		let message = client.createResponse();
		message.writeHead(200,{"content-type":"application/javascript"});
		message.end("return 'I am a told I am a Dexterous Client running on a server'",true).then((result) => {
			console.log(result);
		});
	});
});