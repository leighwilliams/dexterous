(function() {
	class DexterousRemote {
		constructor(client,object) {
			this.client = client;
		}
		get(property) {
			let message = this.client.createResponse();
			message.writeHead(200,{"Content-Type":"application/javascript"});
			return message.end({key:property},true);
		}
		set(property,value) {
			let message = this.client.createResponse();
			message.writeHead(200,{"Content-Type":"application/javascript"});
			return message.end({key:property,value:value},true);
		}
		call(property) {
			let message = this.client.createResponse();
			message.writeHead(200,{"Content-Type":"application/javascript"});
			return message.end({key:property,arguments:[].slice.call(arguments,1)},true);
		}
		apply(property,argumentsList) {
			let message = this.client.createResponse();
			message.writeHead(200,{"Content-Type":"application/javascript"});
			return message.end({key:property,arguments:argumentsList},true);
		}
	}
	Dexterous.Remote = DexterousRemote;
}).call(this);