(function() {
	class DexterousBrowserServer extends Dexterous {
		constructor(options) {
			super(options);
		}
		listen(worker) {
			const me = this;
			me.use(function *(request,response,next) {
				yield next;
				if(!response.getHeader("Status")){
					response.writeHead(501, "text/plain");
					response.end("Not Implemented");
				}
			});
			if(typeof(DedicatedWorkerGlobalScope)!=="undefined" && worker instanceof  DedicatedWorkerGlobalScope) {
				worker.onmessage=function(message){
					const response = me.createResponse(message.data,this);
					me.onmessage(message.data,response);
				};
			} else if(typeof(SharedWorkerGlobalScope)!=="undefined" && worker instanceof SharedWorkerGlobalScope) {
				worker.onconnect=function(e) {
					const port = e.ports[0]; 
					port.onmessage=function(message){
						const response = me.createResponse(message.data,port);
						me.onmessage(message.data,response);
					}
					port.start();
				};
			}
			return Promise.resolve();
		}
	}
	Dexterous.Server = DexterousBrowserServer;
}).call(this);
