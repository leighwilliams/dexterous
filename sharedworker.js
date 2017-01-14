(function() {
	class DexterousSharedWorker extends Dexterous {
		constructor(options) {
			super(options);
		}
		listen(port=window.location.port,host=window.location.hostname,path) {
			const me = this;
			me.worker = new SharedWorker("http://" + host + ":" + port + path);
			me.socket = me.worker.port;
			me.socket.onmessage = (message) => {
				const response = me.createResponse(message.data);
			  	me.onmessage(message.data,response);
			}
			me.socket.start();
			return Promise.resolve();
		}
	}
	Dexterous.SharedWorker = DexterousSharedWorker;
}).call(this);
