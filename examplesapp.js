const DexterousExpress = require("./src/dexterous-express.js"),
	app = new DexterousExpress({trace:1}),
	[node,js,demo,port] = process.argv;
app.static(__dirname+"/examples/"+demo);
app.listen(port ? parseInt(port) : 8080,() => console.log("Listening..."));