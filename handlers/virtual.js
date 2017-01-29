(function() {
	module.exports = (alias,root) => {
		return function virtual(request,response,next) {
			const url = require("url"),
				path = require("path"),
				fs = require("fs");
			if(!request.url) {
				return next;
			}
			const uri = url.parse(request.url).pathname;
			if(uri.indexOf(alias)===0) {
				const filename = path.join(process.cwd()+uri.replace(alias,root));
				try {
					const data = fs.readFileSync(filename);
					response.setHeader("Content-length",Buffer.byteLength(data));
					response.writeHead(200);
					response.end(data);
				} catch(e) {
					return next;
				}
			}
			return next;
		};
	}
}).call(this);