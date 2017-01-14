(function() {
	const f = (request,response,next) => {
		if(request.headers["Content-Type"]==="application/json" && typeof(request.body)==="string") {
			try {
				request.body = JSON.parse(request.body);
			} catch(e) {
				// ignore
			}
		}
		return next;
	};
	if(typeof(module)==="object") {
		module.exports = f;
	} else {
		this.JSONParser = f;
	}
}).call(this);