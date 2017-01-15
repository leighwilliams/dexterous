const Dexterous = require("./dexterous.js"),
	server = new Dexterous.Server(undefined,{secure:false});
server.use(require("./handlers/MethodQueryString.js")());
server.use(require("./handlers/REST.js")("/REST/test/",{
	get: (id,request,response,next) => {
		if(typeof(id)!=="undefined") {
			response.end("GET with id: " + id);
		} else {
			response.end("GET without id");
		}
	},
	post: (id,request,response,next) => {
		if(id) {
			response.end("POST with id: " + id  + (request.body ? " and with body " + JSON.stringify(request.body) : ""));
		} else {
			response.end("POST without id " + (request.body ? " and with body " + JSON.stringify(request.body) : ""));
		}
	},
	put: (id,request,response,next) => {
		if(id) {
			response.end("PUT with id: " + id  + (request.body ? " and with body " + JSON.stringify(request.body) : ""));
		} else {
			response.end("PUT without id"  + (request.body ? " and with body " + JSON.stringify(request.body) : ""));
		}
	},
	delete: (id,request,response,next) => {
		if(id) {
			response.end("DELETE with id: " + id);
		} else {
			response.end("DELETE without id ... which should probably throw an error in production or be ignored.");
		}
	}
}));
server.use(require("./handlers/DefaultFile.js")("index.html"));
server.use(require("./handlers/static.js")("examples"));
server.use(require("./handlers/URLContentType"));
server.use(require("./handlers/JSONParser.js"));
server.use(require("./handlers/JavaScriptRunner.js")({},true));


server.listen(3000,"127.0.0.1").then(() => {
	const client = new Dexterous.Client();
	client.use(require("./handlers/JSONParser.js"));
	client.listen(3000,"127.0.0.1").then(() => {
		let message = client.createResponse();
		message.writeHead(200,{"Content-Type":"application/javascript"});
		message.end("return 'I am a told I am a Dexterous Client running on a server'",true).then((result) => {
			console.log(result);
		});
	});
});