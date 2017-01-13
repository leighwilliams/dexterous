const Dexterous = require("./dexterous.js"),
	server = new Dexterous.Server(undefined,{secure:false});
//server.use(Dexterous.ConsoleLogger);
server.use(Dexterous.JavaScriptRunner({},true));
server.use(Dexterous.URLContentType);
server.use(Dexterous.static("examples"));
server.use(Dexterous.virtual("/dexterous","/"));

server.listen(3000,"127.0.0.1").then(() => {
	const client = new Dexterous.Client();
	client.use(Dexterous.JSONParser);
	client.listen(3000,"127.0.0.1").then(() => {
		let message = client.createResponse();
		message.writeHead(200,{"Content-Type":"application/javascript"});
		message.end("return 'I am a told I am a Dexterous Client running on a server'",true).then((result) => {
			console.log(result);
		});
	});
});