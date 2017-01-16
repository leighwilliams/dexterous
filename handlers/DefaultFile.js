(function() {
	module.exports = (file) => function(request,response,next) {
		if(request.url && request.url[request.url.length-1]==="/") {
			request.url = request.url + file;
		}
		if(request.constructor.name==="IncommingMessage" && request.headers && request.headers.referer && request.headers.referer[request.headers.referer.length-1]==="/") {
			request.headers.referer = request.headers.referer + file;
		}
		return next;
	};
}).call(this);