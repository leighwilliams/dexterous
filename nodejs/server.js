(function() {
	module.exports = function(imports) {
		const Dexterous = imports.Dexterous;
		class DexterousServer extends Dexterous {
			constructor(server,options) {
				super(options);
				this.server = server;
				try {
					this.use(require("dexterous/handlers/virtual")("/dexterous","/node_modules/dexterous"));
				} catch(e) {
					this.use(require("../handlers/virtual.js")("/dexterous","/"));
				}
			}
			listen(port,location) {
				const me = this;
				if(!me.server) {
					const protocol = (me.options.secure ? require("https") : require("http")),
						SocketServer = require("ws").Server;
					me.server = protocol.createServer((request,response) => {
						let body = [];
						request.on('data', function(chunk) {
						  body.push(chunk);
						}).on('end', function() {
						  request.body = Buffer.concat(body).toString();
						  me.onmessage(request,response);
						});
						
					});
					me.socket = new SocketServer({server:me.server});
				}
				if(typeof(me.options.last)==="function") {
					me.use(me.options.last);
				} else {
					const url = require("url"),
						path = require("path"),
						fs = require("fs"),
						os = require("os");
					me.use(function *(request,response,next) {
						yield next;
						if(!response._headerSent && request.headers["content-type"]) {
							if(request.url) {
								const uri = url.parse(request.url).pathname,
								filename = path.join(process.cwd(),uri);
								fs.readFile(filename,(err,data) => {
									if(!err) {
										response.writeHead(200);
										response.end(data);
									} else {
										response.writeHead(404, {"content-type":"text/plain"});
										response.end("Not Found");
									}
								});
							} else {
								response.writeHead(501, {"content-type":"text/plain"});
								response.end("Not Implemented");
							}
						} else if(response.getHeader("status")===204) {
							response.end();
						}
					});
				}
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
							// not just an ack with no return value
							if(!(message.headers.status===204 && message.headers.responseToMessageId)) {
								const response = me.createResponse(message,ws);
								me.onmessage(message,response);
							}
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