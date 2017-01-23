(function() {
	const f = (scope={},returnsError,keyProperty="_id") => {
		return function RemoteCall(request,response,next) {
			let me = scope,
				body = request.body,
				type = typeof(body);
			if(["application/javascript","text/javascript"].indexOf(request.headers["content-type"])>=0
					&& request.method.toLowerCase()==="get"
					&& request.body
					&& (type==="object" || type==="string")) {
				if(type==="string") {
					try {
						body = JSON.parse(body);
					} catch(e) {
						return next;
					}
				}
				if(body.thisArg) {
					me = body.thisArg;
				} else {
					if(me[body.className]) {
						me = me[body.className];
					}
					if(me.instances && body.thisId && me.instances[body.thisId]) {
						me = me.instances[body.thisId];
					}
				}
				type = (body.key==="new" ? "function" : typeof(me[body.key]));
				if(body.object) {
					const result = Object.create(me.prototype);
					result.constructor = me;
					Object.keys(body.object).forEach((key) => {
						result[key] = body.object[key];
					});
					if(body.thisId) {
						result[keyProperty] = body.thisId;
					}
					me.instances || (me.instances={});
					me.instances[result[keyProperty]] = result;
					response.writeHead(200,{"content-type":"application/json"});
					response.end(true);
				} else if(type==="function") {
					try {
						let result;
						if(body.key==="new") {
							result = new me(...body.argumentsList);
							me.instances || (me.instances={});
							me.instances[result[keyProperty]] = result;
						} else {
							result = me[body.key](...body.argumentsList);
						}
						response.writeHead(200,{"content-type":"application/json"});
						response.end(result);
					} catch(e) {
						const msg = "Expression: '"+ JSON.stringify(request.body) + "' caused an error!";
						console.log(msg+"\n",e);
						if(returnsError) {
							response.writeHead(500,{"content-type":"text/plain"});
							response.end(msg);
						} else {
							return next;
						}
					}
				} else if(body.key) {
					if(typeof(body.value)!=="undefined") {
						me[body.key] = body.value;
						response.writeHead(200,{"content-type":"application/json"});
						response.end(true);
					} else {
						const result = me[body.key];
						response.writeHead(200,{"content-type":"application/json"});
						response.end(result);
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
		this.RemoteCall = f;
	}
}).call(this);