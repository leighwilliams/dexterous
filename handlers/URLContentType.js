(function() {
	module.exports = (moreTypes={}) => { 
		return function URLContentType(request,response,next) {
			if(request.url) {
				const i = request.url.lastIndexOf(".");
				if(i>0) {
					const types = {
							".gzip": "application/gzip",
							".gif": "image/gif",
							".htm": "text/html",
							".html": "text/html",
							".ico": "image/x-icon",
							".jpg": "image/jpeg",
							".jpeg": "image/jpeg",
							".js": "application/javascript",
							".md": "text/markdown",
							".mp4": "video/mp4",
							".mp4v": "video/mp4",
							".mpg4": "video/mp4",
							".mpg": "video/mpeg",
							".mpeg": "video/mpeg",
							".pdf": "applicaion/pdf",
							".png": "image/png",
							".txt": "text/plain",
							".wsdl": "application/wsdl+xml",
							".xml": "application/xml",
							".xsl": "application/xml"
					},
					ext = request.url.substring(i);
					let type = moreTypes[ext];
					if(type) {
						request.headers["content-type"]=type;
					} else {
						type = types[ext];
						if(type) {
							request.headers["content-type"]=type;
						}
					}
				}
			}
			return next;
		}
	};
}).call(this);