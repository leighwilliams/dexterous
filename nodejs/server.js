(function() {
	module.exports = function(imports) {
		const Dexterous = imports.Dexterous;
		class DexterousServer extends Dexterous {
			constructor(server,options) {
				super(options);
				this.server = server;
				try {
					this.use(require("dexterous/handlers/virtual")("/dexterous","/node_modules/dexterous"));
					//console.log("using package")
				} catch(e) {
					//console.log("using source")
					this.use(require("../handlers/virtual.js")("/dexterous","/"));
				}
			}
			listen(port,location) {
				const me = this;
				if(!me.server) {
					const protocol = (me.options.secure ? require("https") : require("http")),
						url = require("url"),
						path = require("path"),
						fs = require("fs"),
						WebSocket = require("ws"),
						os = require("os"),
						SocketServer = WebSocket.Server;
					me.server = protocol.createServer((request,response) => {
						me.onmessage(request,response);
					});
					me.socket = new SocketServer({server:me.server});
					me.use(function *(request,response,next) {
						yield next;
						if(request.url) {
							const uri = url.parse(request.url).pathname,
							filename = path.join(process.cwd(),uri);
							fs.readFile(filename,(err,data) => {
								if(!err) {
									response.writeHead(200);
									response.end(data);
								} else {
									response.writeHead(404, "text/plain");
									response.end("Not Found");
								}
							});
						} else if(!response.getHeader("Status")){
							response.writeHead(501, "text/plain");
							response.end("Not Implemented");
						}
					});
				};
				return new Promise((resolve,reject) => {
					me.server.listen(port,location,() => { 
						 console.log("Dexterous listening on " + (me.options.secure ? "https" : "http") + "://" + (location ? location : "*") + ":" + port);
						 resolve();
					});
					me.socket.on("connection", (ws) => {
						ws.on("message",(message) => { 
							try {
								message = (typeof(message)==="string" ? JSON.parse(message) : message);
								message.headers || (message.headers={});
							} catch(e) {
								// ignore;
							}
							const response = me.createResponse(message,ws);
							me.onmessage(message,response);
						});
						ws.on("error",me.onerror);
					});
				});
			}
			broadcast(response) {
				const me = this;
				me.socket.clients.forEach((client,i) => {
					const message = me.createResponse(undefined,client);
					message.headers = response.headers;
					message.body = response.body;
					message.headers.sent = false;
					message.end();
				});
			}
		}
		return DexterousServer;
	}
}).call(this);