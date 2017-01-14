(function() {
	const f = (scope={},returnsError) => {
		return (request,response,next) => {
			if(["application/javascript","text/javascript"].indexOf(request.headers["Content-Type"])>=0 && typeof(request.body)==="string") {
				try {
					const result = new Function(request.body).call(scope);
					if(request.headers.method==="GET") {
						response.writeHead(200,{"Content-Type":"application/json"});
						response.end(result);
					} else {
						response.writeHead(200);
					}
				} catch(e) {
					const msg = "Expression: '"+ request.body + "' caused an error!";
					console.log(msg+"\n",e);
					if(returnsError) {
						response.writeHead(500,{"Content-Type":"text/plain"});
						response.end(msg);
					}
				}
				return;
			}
			return next;
		}
	}
	if(typeof(module)==="object") {
		module.exports = f;
	} else {
		this.JavaScriptRunner = f;
	}
}).call(this);