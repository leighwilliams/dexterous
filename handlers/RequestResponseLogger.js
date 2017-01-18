(function() {
	const f = function *RequestResponseLogger(request,response,next) {
		console.log("Request",request);
		yield next;
		console.log("Response",response);
		return next;
	};
	if(typeof(module)==="object") {
		module.exports = f;
	} else {
		this.RequestResponseLogger = f;
	}
}).call(this);