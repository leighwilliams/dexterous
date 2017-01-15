(function() {
	module.exports = (file) => function(request,response,next) {
		if(request.url && request.url[request.url.length-1]==="/") {
			request.url = request.url + file;
		}
		return next;
	};
}).call(this);