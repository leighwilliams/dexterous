(function() {
	class DexterousRemote {
		constructor(target,schema,client,socket) {
			if(!schema.keyProperty) {
				schema.keyProperty = "_id";
			}
			this.schema = schema;
			this.target = target;
			this.client = client;
			this.socket = socket;
		}
		apply(thisId,key,argumentsList) {
			let me = this,
				message = me.client.createResponse(undefined,me.socket),
				type = typeof(me.target);
			message.writeHead(200,{"content-type":"application/javascript"});
			if(type==="function") {
				return message.end({key,argumentsList,className:me.target.name},true).then((object) => {
					if(key==="new") {
						const instance = Object.create(me.target.prototype);
						instance.constructor = me.target;
						Object.keys(object).forEach((key) => {
							instance[key] = object[key];
						});
						return me.client.createRemoteProxy(instance);
					} else {
						return object;
					}
				});
			} else if(this.target && type==="object") {
				return message.end({thisId:this.target[this.schema.keyProperty],key,argumentsList,className:this.target.constructor.name},true);
			} else {
				return message.end({key,argumentsList},true);
			}
		}
		call(thisId,key) {
			return this.apply(thisId,key,[].slice.call(arguments,2));
		}
		get(thisId,key) {
			let message = this.client.createResponse(undefined,this.socket);
			message.writeHead(200,{"content-type":"application/javascript"});
			return message.end({thisId:(this.target ? this.target[this.schema.keyProperty] : undefined),key,className:(this.target ? this.target.constructor.name : "Object")},true);
		}
		put(thisId,object) {
			let message = this.client.createResponse(undefined,this.socket);
			message.writeHead(200,{"content-type":"application/javascript"});
			return message.end({thisId:(thisId ? thisId : object[this.schema.keyProperty]),object,className:object.constructor.name},true);
		}
		set(thisId,key,value) {
			let message = this.client.createResponse(undefined,this.socket);
			message.writeHead(200,{"content-type":"application/javascript"});
			return message.end({thisId:(this.target ? this.target[this.schema.keyProperty] : undefined),key,value,className:(this.target ? this.target.constructor.name : "Object")},true);
		}
	}
	Dexterous.prototype.createRemote = function(schema={},socket) {
		return new DexterousRemote(undefined,schema,this,socket);
	};
	Dexterous.prototype.createRemoteProxy = function(target,schema={},socket) {
		const me = this,
			remote = new DexterousRemote(target,schema,this,socket);
		if(typeof(target)==="function") {
			return new Proxy(function() {},{
				construct: (ignore, argumentsList, newTarget) => {
					return remote.apply(undefined,"new",argumentsList);
				}
			})
		} else {
			return new Proxy(target,{
				get: (target,property,receiver) => {
					let value = target[property];
					if(typeof(value)==="function") {
						const fstr = value+"",
							body = fstr.substring(fstr.indexOf("{"));
						if(body==="{}") {
							return function() {
								const message = remote.client.createResponse(undefined,remote.socket);
								message.writeHead(200,{"content-type":"application/javascript"});
								return message.end({thisId:target[remote.schema.keyProperty],key:property,argumentsList:[].slice.call(arguments),className:target.constructor.name},true);
							}
						}
						return value;
					}
					return value;
				}
			});
		}
	};
}).call(this);