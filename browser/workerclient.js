(function() {
	class DexterousWorkerClient extends Dexterous {
		constructor(options) {
			super(options);
		}
		listen(port=window.location.port,host=window.location.hostname,path) {
			const me = this;
			me.worker = new Worker("http://" + host + ":" + port + path);
			me.socket = me.worker;
			me.socket.onmessage = (message) => {
				const response = me.createResponse(message.data);
				me.onmessage(message.data,response);
			};
			return Promise.resolve();
		}
	}
	Dexterous.WorkerClient = DexterousWorkerClient;
}).call(this);

	