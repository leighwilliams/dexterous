const DexterousHttpServer = require("../../dist/dexterous-http-server.js"),
	app = new DexterousHttpServer({trace:1}),
	[node,js,demo,port] = process.argv;
app.static(__dirname);
app.use(
	function checkPath(value) {
		const {request} = value;
		if(request.location.pathname==="/hello") {
			return {value}; // pass value to next step
		}
		return {done:true,value}; // we are done with this middleware
	},
	function sayHello(value) {
		const {response} = value;
		response.end("Hello");
		return; // we are done with processing
	}
);
app.route("/goodbye").use(
	function sayGoodbye(value) {
			const {response} = value;
			response.end("Goodbye");
			return; // we are done with processing
		}
	);
app.listen(port ? parseInt(port) : 8080);



