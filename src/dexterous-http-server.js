(function() {
	let Dexterous = this.Dexterous;
	if(typeof(module)!=="undefined") {
		Dexterous = require("./dexterous.js");
	}
	
	let staticRouter;
	if(typeof(module)!=="undefined") {
		const fs = require("fs"),
			path = require("path");
		staticRouter = (root,options={}) => {
			return async function staticRouter(value) {
				const {request,response} = value,
					pathname = request.location.pathname,
					file = pathname[pathname.length-1]==="/" ? pathname + options.default||"index.html" : pathname,
					extension = file.split(".").pop(),
					contentType = request.app.mimeTypes[extension];
				if(contentType) {
					const result = await new Promise(resolve => {
						try {
							fs.readFile(`${root}${path.normalize(file)}`, function(err, data){
								if(!err) {
									response.writeHead(200, {"Content-Type": contentType});
									response.write(data);
									response.end();
									resolve();
								} else if(err.code==="ENOENT") {
									resolve(err);
								} else {
									resolve(true);
								}
							}); 
						} catch(err) {
							resolve(err);
						}
					});
					if(!result) return;
					if(result===true) return {value};
					if(result instanceof Error) {
						value.error = result;
					}
				}
				return {value};
			}
		}
	}
	if(typeof(window)!=="undefined") {
		staticRouter = (paths={},options={}) => {
			return function staticRouter(value) {
				const {request,response} = value,
					pathname = request.location.pathname,
					file = pathname[pathname.length-1]==="/" ? pathname + options.default||"index.html" : pathname,
					data = paths[file],
					extension = file.split(".").pop(),
		  			contentType = request.app.mimeTypes[extension];
				if(data && contentType) {
					response.writeHead(200, {"Content-Type": contentType});
					response.write(data);
					response.end();
				}	else {
					return {value};
				}
			}
		}
	}
	class DexterousHttpServer extends Dexterous {
		constructor(options) {
			super(options);
			super.use(
				function getLocation(value) {
					const {request} = value;
					if(!request.location && request.headers) {
						const url = (request.headers.encyrpted ? "https://" : "http://") + request.headers.host + request.url;
						request.location = new URL(url);
					}
					return {value};
				}	
			);
		}
		final(value) {
			const {request,response,error} = value||{};
			if(typeof(module)!=="undefined") {
				if(!response.headersSent) {
					if(error && !error.message.includes("ENOENT")) {
						response.writeHead(500, {"Content-Type": "text/plain"});
						response.write(error.message);
						response.end();
					} else if(response) {
						response.writeHead(404, {"Content-Type": "text/plain"});
						response.write("Not Found");
						response.end();
					}
				}
				return value;
			}
			value = {request,error};
			if(error && !error.message.includes("ENOENT")) {
				value.response = new Response("Internal Server Error",{status:500,statusText:"Internal Server Error"});
			}
			value.response = new Response("Not Found",{status:404,statusText:"Not Found"});
			return value;
		}
		listen(port,...args) {
			if(typeof(module)!=="undefined") {
				this.server = require("http").createServer((request,response) => { request.app = this; this.handle({request,response}); });
			  return this.server.listen.call(this.server,port,...args);
			}
			super.listen(port,...args);
		}
		static(root,options) {
			super.use(staticRouter(root,options));
		}
		use(...pipeline) {
	  	if(typeof(pipeline[0])==="string") {
	  		const me = this,
	  			path = pipeline[0];
	  		pipeline[0] = function pathMatch(value) {
	  			const {request} = value;
	  			if(me.pathMatch(path,request.location.pathname)) {
	  				return {value};
	  			}
	  			return {done:true,value};
	  		}
	  	}
			return super.use(...pipeline);
		}
	}
	
	if(typeof(module)!=="undefined") module.exports = DexterousHttpServer;
	if(typeof(window)!=="undefined") window.DexterousHttpServer = DexterousHttpServer;
}).call(this);