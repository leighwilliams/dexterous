(function() {
	function JSONParser(request,response,next) {
		if(request.headers["content-type"]==="application/json" && typeof(request.body)==="string") {
			try {
				request.body = JSON.parse(request.body);
			} catch(e) {
				// ignore
			}
		}
		return next;
	};
	if(typeof(module)==="object") {
		module.exports = JSONParser;
	} else {
		this.JSONParser = JSONParser;
	}
}).call(this);