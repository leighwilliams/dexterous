(function() {
	class DexterousServiceWorker {
		constructor(path) {
			this.path = path;
		}
		listen(options) {
			const path = this.path;
			navigator.serviceWorker.register(path,options)
		  .then(function(reg) {
		    console.log(`Dexterous running ${path}. Scope is ${reg.scope}`);
		  }).catch(function(error) {
		    console.log(`Dexterous run ${path} failed with ${error}`);
		  });
		}
	}
	
	if(typeof(module)!=="undefined") module.exports = DexterousServiceWorker;
	if(typeof(window)!=="undefined") window.DexterousServiceWorker = DexterousServiceWorker;
}).call(this);