(function() {
	const url = require("url"),
		path = require("path");
	module.exports = (path,restHandlers) => { 
		return function REST(request,response,next) {
			if(request.url) {
				let uri = url.parse(request.url).pathname,
					parts = uri.split("/").filter((item) => item!==""), // will use later for wildcard matching
					alturi;
				let id;
				if(uri[uri.length-1]!=="/") {
					id = parts[parts.length-1];
					alturi = "/" + parts.slice(0,parts.length-1).join("/") + "/";
				}
				if(uri===path || alturi===path) {
					const method = (request.method ? request.method.toLowerCase() : "get");
					let result;
					if((method==="get" || method==="delete" || ((method==="put" || method==="post") && !request.body)) && !id) {
						response.writeHead(400);
						response.end("Bad Request");
					} else if(restHandlers[method]) {
						const result = restHandlers[method](id,request,response,next);
						if(!result && !response._headerSent) {
							return next;
						}
						return result;
					}
				}
			}
			return next;
		}
	};
}).call(this);