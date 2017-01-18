(function() {
	const url = require("url"),
		path = require("path"),
		fs = require("fs");
	module.exports = (root="/") => {
		return function static(request,response,next) {
			if(!request.url) {
				return next;
			}
			const uri = url.parse(request.url).pathname,
			filename = path.join(process.cwd()+(root && root.length>0 ? root : ""),uri);
			try {
				const data = fs.readFileSync(filename);
				response.writeHead(200);
				response.end(data);
			} catch(e) {
				return next;
			}
		};
	};
}).call(this);