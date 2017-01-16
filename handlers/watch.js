(function() {
	const watch = require("watch"),
		url = require("url");
	module.exports = (server,root="/") => {
		const watchpath = process.cwd()+root;
		if(!server.requests) {
			server.requests={};
			watch.watchTree(watchpath, {interval:1}, (path,curr,prev) => {
				server.socket.clients.forEach((client,i) => {
					if(server.requests[client.href]) {
						if(Object.keys(server.requests[client.href]).some((uri) => {
							const pathname = path.substring(path.length-uri.length).replace(/\\/g,"/");
							return pathname===uri || url.parse(client.href).pathname===uri;
						})) {
							const message = server.createResponse(undefined,client);
							message.writeHead(200,{"content-type": "application/javascript"});
							message.end("document.location.reload(true);");
						}
					}
				});
			});
			return function(request,response,next) {
				server.socket.clients.forEach((client,i) => {
					if(request.url && request.headers && request.headers.referer) {
						const uri = url.parse(request.url).pathname
						server.requests[request.headers.referer] || (server.requests[request.headers.referer]={});
						server.requests[request.headers.referer][uri] = true;
					}
				});
				return next;
			}
		}
	};
}).call(this);