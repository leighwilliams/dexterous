(function() {
	module.exports = (moreTypes={}) => function(request,response,next) {
		if(request.url) {
			const i = request.url.lastIndexOf(".");
			if(i>0) {
				const types = {
						".js": "application/javascript",
						".htm": "text/html",
						".html": "text/html"
					},
					ext = request.url.substring(i);
				let type = moreTypes[ext];
				if(type) {
					response.setHeader("Content-Type",type);
				} else {
					type = types[ext];
					if(type) {
						response.setHeader("Content-Type",type);
					}
				}
			}
		}
		return next;
	}
}).call(this)