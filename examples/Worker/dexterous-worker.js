(function() {
	class DexterousWorker {
		constructor(path) {
			this.path = path;
			this.callbacks = new Map();
		}
		close() {
			!this.server || this.server.close();
		}
		listen(path,options) {
			path || (path = this.path);
			this.server = new Worker(path);
			this.server.onmessage = ({data:{id,message}}) => {
				const callback = this.callbacks.get(id);
				if(callback) {
					this.callbacks.delete(id);
					callback(message);
				}
			};
			return this.server;
		}
		handle(message,callback) {
			if(!this.server) this.listen();
			const id = this.callbacks.size;
			this.callbacks.set(id,callback);
			this.server.postMessage({id,message});
		}
		
	}
	
	if(typeof(module)!=="undefined") module.exports = DexterousWorker;
	if(typeof(window)!=="undefined") window.DexterousWorker = DexterousWorker;
}).call(this);