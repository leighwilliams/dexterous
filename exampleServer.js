const Dexterous = require("./dexterous.js"),
	server = new Dexterous.Server(undefined,{secure:false});
server.use(require("./handlers/JSONParser.js"));
server.use(require("./handlers/JavaScriptRunner.js")({},true));
server.use(require("./handlers/URLContentType"));
server.use(require("./handlers/static.js")("examples"));


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