class TestClass {
	constructor(name) {
		this._id = Math.round(Math.random()*100);
		this.name = name;
		TestClass.instances[this._id] = this;
	}
}
TestClass.instances = {};

scope = {testFunction: (arg) => { return "I am the server testFunction result, the arg was " + arg + ".";}, testProperty: "testValue", TestClass}

importScripts("/dexterous/dexterous.js",
		"/dexterous/remote.js",
		"/dexterous/browser/server.js",
		"/dexterous/handlers/RemoteCall.js");
const server = new Dexterous.Server(),
	socket = this;
server.use(RemoteCall(scope,true));
server.listen(this).then(() => {
	let remote = server.createRemote(undefined,socket);
	remote.call(undefined,"testFunction",1).then((result) => {
		console.log(result);
	});
});