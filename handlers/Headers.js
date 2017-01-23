(function() {
	const f = (headers) => {
		return function Headers(request,response,next) {
			if(!response._headerSent) {
				Object.keys(headers).forEach((header) => {
					response.setHeader(header,headers[header]);
				});
			}
			return next;
		};
	}
	if(typeof(module)==="object") {
		module.exports = f;
	} else {
		this.Headers = f;
	}
}).call(this);