(function() {
	const f = (scope,returnsError) => {
		return (request,response,next) => {
			if(["application/javascript","text/javascript"].indexOf(request.headers["Content-Type"])>=0 && request.body && typeof(request.body)==="object") {
				let object = scope;
				if(request.body.id) {
					// object = 
				}
				const type = typeof(scope[request.body.key]);
				if(type==="function") {
					try {
						const result = scope[request.body.key].apply(scope,request.body.arguments);
						response.writeHead(200,{"Content-Type":"application/json"});
						response.end(result);
					} catch(e) {
						const msg = "Expression: '"+ JSON.stringify(request.body) + "' caused an error!";
						console.log(msg+"\n",e);
						if(returnsError) {
							response.writeHead(500,{"Content-Type":"text/plain"});
							response.end(msg);
						} else {
							return next;
						}
					}
					
				} else if(typeof(request.body.value)!=="undefined") {
					scope[request.body.key] = request.body.value;
					response.writeHead(200);
					response.end();
				} else {
					const result = scope[request.body.key];
					response.writeHead(200,{"Content-Type":"application/json"});
					response.end(result);
				}
				return;
			}
			return next;
		}
	}
	if(typeof(module)==="object") {
		module.exports = f;
	} else {
		this.RemoteCall = f;
	}
}).call(this);