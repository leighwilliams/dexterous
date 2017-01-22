(function() {
	const watch = require("watch"),
		url = require("url");
	module.exports = (server,root="/") => {
		const watchpath = process.cwd()+root;
		if(!server.requests) {
			server.requests={};
			watch.watchTree(watchpath, {interval:1}, (f,curr,prev) => {
				if (typeof f == "object" && prev === null && curr === null) {
					// Finished walking the tree
				} else if (prev === null) {
					// f is a new file
				} else if (curr.nlink === 0) {
					// f was removed
				} else {
					server.socket.clients.forEach((client,i) => {
						if(server.requests[client.href]) {
							const hpathname =  url.parse(client.href).pathname,
							pathname =  f.substring(f.length-hpathname.length).replace(/\\/g,"/");
							if(hpathname===pathname || Object.keys(server.requests[client.href]).some((uri) => {
								const pathname = f.substring(f.length-uri.length).replace(/\\/g,"/");
								return pathname===uri;
							})) {
								const message = server.createResponse(undefined,client);
								message.writeHead(200,{"content-type": "application/javascript"});
								message.end("document.location.reload(true);");
								console.log("document.location.reload(true);")
							}
						}
					});
				}
			});
			return function watch(request,response,next) {
				if(request.headers && request.headers.referer && request.headers.referer[request.headers.referer.length-1]!="/") {
					if(response.socket) {
						response.socket.href = request.headers.referer;
					}
					server.requests[request.headers.referer] || (server.requests[request.headers.referer]={});
					if(request.url) {
						const uri = url.parse(request.url).pathname;
						server.requests[request.headers.referer][uri] = true;
					}
				}
				return next;
			}
		}
	};
}).call(this);