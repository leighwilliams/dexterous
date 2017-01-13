importScripts("/dexterous/dexterous.js","/dexterous/handlers/JavaScriptRunner.js");
const server = new Dexterous.Server();
server.use(JavaScriptRunner({},true));
server.listen(this);