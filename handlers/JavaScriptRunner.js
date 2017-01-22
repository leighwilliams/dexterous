(function() {
	const f = (scope={},returnsError=false) => {
		return function JavaScriptRunner(request,response,next) {
			if(["application/javascript","text/javascript"].indexOf(request.headers["content-type"])>=0 && typeof(request.body)==="string") {
				try {
					const result = new Function(request.body).call(scope);
					if(request.method.toLowerCase()==="get") {
						response.setHeader("status",200);
						response.setHeader("content-type","application/json");
						response.end(result);
					} else {
						response.setHeader("status",200);
					}
				} catch(e) {
					const msg = "Expression: '"+ request.body + "' caused an error!";
					console.log(msg+"\n",e);
					if(returnsError) {
						response.setHeader("status",500);
						response.setHeader("content-type","text/plain");
						response.end(msg);
					}
				}
				return;
			}
			return next;
		};
	}
	if(typeof(module)==="object") {
		module.exports = f;
	} else {
		this.JavaScriptRunner = f;
	}
}).call(this);