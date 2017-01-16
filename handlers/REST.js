(function() {
	const url = require("url"),
		path = require("path");
	module.exports = (path,restHandlers) => function(request,response,next) {
		if(request.url) {
			let uri = url.parse(request.url).pathname,
				parts = uri.split("/"); // will use later for wildcard matching
			let id;
			if(uri[uri.length-1]!=="/") {
				id = parts[parts.length-1];
				parts = parts.slice(0,parts.length-1);
				uri = parts.join("/") + "/";
			}
			if(uri===path) {
				const method = (request.headers.method ? request.headers.method.toLowerCase() : "get");
				if(restHandlers[method]) {
					restHandlers[method](id,request,response,next);
				}
			}
		}
		return next;
	};
}).call(this);