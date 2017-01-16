importScripts("/dexterous/dexterous.js",
		"/dexterous/remote.js",
		"/dexterous/browser/server.js",
		"/dexterous/handlers/RemoteCall.js");
const server = new Dexterous.Server(),
	socket = this;
server.use(RemoteCall({testFunction: (arg) => { return "I am the server testFunction result, the arg was " + arg + ".";}, testProperty: "testValue"},true));
server.listen(this).then(() => {
	let remote = server.createRemote(undefined,socket);
	remote.call(undefined,"testFunction",1).then((result) => {
		console.log(result);
	});
});