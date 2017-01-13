importScripts("/dexterous/dexterous.js","/dexterous/handlers/RequestResponseLogger.js","/dexterous/handlers/JSONParser.js","/dexterous/handlers/RemoteCall.js");
const server = new Dexterous.Server();
server.use(RequestResponseLogger);
server.use(JSONParser);
server.use(RemoteCall({testFunction: (arg) => { return "I am the testFunction result, the arg was " + arg + ".";}, testProperty: "testValue"},true));
server.listen(this);