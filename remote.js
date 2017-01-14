(function() {
	class DexterousRemote {
		constructor(client,object) {
			this.client = client;
		}
		get(thisId,key) {
			let message = this.client.createResponse();
			message.writeHead(200,{"Content-Type":"application/javascript"});
			return message.end({thisId,key},true);
		}
		set(thisId,key,value) {
			let message = this.client.createResponse();
			message.writeHead(200,{"Content-Type":"application/javascript"});
			return message.end({thisId,key,value},true);
		}
		call(thisId,key) {
			let message = this.client.createResponse();
			message.writeHead(200,{"Content-Type":"application/javascript"});
			return message.end({thisId,key,argumentsList:[].slice.call(arguments,2)},true);
		}
		apply(thisId,key,argumentsList) {
			let message = this.client.createResponse();
			message.writeHead(200,{"Content-Type":"application/javascript"});
			return message.end({thisId,key,argumentsList},true);
		}
	}
	Dexterous.Remote = DexterousRemote;
}).call(this);