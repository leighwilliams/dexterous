(function() {
	class DexterousRemote {
		constructor(client,socket) {
			this.client = client;
			this.socket = socket;
		}
		get(thisId,key) {
			let message = this.client.createResponse(undefined,this.socket);
			message.writeHead(200,{"content-type":"application/javascript"});
			return message.end({thisId,key},true);
		}
		set(thisId,key,value) {
			let message = this.client.createResponse(undefined,this.socket);
			message.writeHead(200,{"content-type":"application/javascript"});
			return message.end({thisId,key,value},true);
		}
		call(thisId,key) {
			let message = this.client.createResponse(undefined,this.socket);
			message.writeHead(200,{"content-type":"application/javascript"});
			return message.end({thisId,key,argumentsList:[].slice.call(arguments,2)},true);
		}
		apply(thisId,key,argumentsList) {
			let message = this.client.createResponse(undefined,this.socket);
			message.writeHead(200,{"content-type":"application/javascript"});
			return message.end({thisId,key,argumentsList},true);
		}
	}
	Dexterous.prototype.createRemote = function(schema,socket) {
		return new DexterousRemote(this,socket);
	};
}).call(this);