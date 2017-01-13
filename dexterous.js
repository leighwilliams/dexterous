(function() {
	const ONSERVER = (typeof(window)==="undefined" && typeof(require)==="function" && typeof(module)==="object" ? true : false);
	class DexterousResponse {
		constructor(client,request,socket) {
			Object.defineProperty(this,"client",{configurable:true,writable:true,value:client});
			if(socket) {
				Object.defineProperty(this,"socket",{configurable:true,writable:true,value:socket});
			}
			this.headers = { };
			if(request && request.headers && request.headers.messageId) {
				this.setHeader("responseToMessageId",request.headers.messageId);
			}
		}
		write(text) {
			if(typeof(this.body)==="undefined") {
				this.body = "";
			}
			this.body += text;
		}
		writeHead(status,reason,headers) {
			const me = this;
			me.setHeader("Status",status);
			if(reason && typeof(reason)==="object") {
				headers = reason;
			}
			if(headers && typeof(headers)==="object") {
				Object.keys(headers).forEach((key) => {
					me.setHeader(key,headers[key]);
				});
			}
		}
		getHeader(property) {
			return this.headers[property];
		}
		setHeader(property,value) {
			this.headers[property] = value;
		}
	}
	DexterousResponse.prototype.end = function(data,wait) {
		if(this.headers.sent) {
			throw new Error("response already sent");
		}
		const type = typeof(data);
		if(!this.headers["Content-Type"]) {
			if(data && type==="object") {
				this.headers["Content-Type"] = "application/json";
			} else if(["string","number","boolean"].indexOf(type)>=0) {
				this.headers["Content-Type"] = "text/plain";
			}
		}
		if(type==="object") { // arguments.length===1
			this.body = data;
		} else if(type!=="undefined"){
			this.write(data);
		}
		
		if(!this.headers.Status) {
			this.headers.Status = 200;
		}
		return this.client.send(this,wait);
	}
	class Dexterous {
		constructor(options={}) {
			this.waiting = {}; // id map of messages waiting for response
			this.handlers = []; // array of handlers added by this.use
			this.options = options;
			this.onerror = (err) => {
				console.log(err);
			}
		}
		createResponse(request,socket) {
			return new DexterousResponse(this,request,socket);
		}
		onmessage(request,response) {
			const me = this,
				iterators = [];
			me.handlers.forEach((handler) => {
				iterators.push(handler.call(me,request,response,true));
			});
			// go down the handler stack
			let maxi = 0;
			iterators.every((iterator,i) => {
				const result = iterator.next();
				if(result.value) {
					maxi = i;
					return true;
				};
			});
			// go back up the handler stack;
			iterators.slice(0,maxi+1).reverse().forEach((iterator) => {
				iterator.next();
			});
			// handle messages that were waiting for a response
			if(me.waiting[request.headers.responseToMessageId]) {
				me.waiting[request.headers.responseToMessageId](request.body);
				delete me.waiting[request.headers.responseToMessageId];
			}
		}
		onerror(err) { 
			console.log(err);
		}
		send(message,expect) {
			let result;
			const socket = (message.socket ? message.socket : this.socket);
			if(!message.getHeader("messageId")) {
				message.setHeader("messageId",parseInt((Math.random()+"").substring(2)));
			}
			if(expect) {
				let resolver,
					rejector;
				result = new Promise((resolve,reject) => { resolver=resolve; rejector=reject; });
				message.setHeader("method","GET");
				this.waiting[message.getHeader("messageId")] = resolver;
			}

			if(typeof(socket.postMessage)==="function") {
				socket.postMessage(message);
			} else {
				socket.send(JSON.stringify(message));
			}
			message.headers.sent = true;
			return result;
		}
		use(handler) {
			const GeneratorFunction = function*(){}.constructor;
			if(handler instanceof GeneratorFunction) {
				this.handlers.push(handler);
			} else {
				this.handlers.push(function *() { yield handler.call(undefined,...arguments); });
			}
		}
	}
	class DexterousWorker extends Dexterous {
		constructor(options) {
			super(options);
		}
		listen(port=window.location.port,host=window.location.hostname,path="/dexterous/worker.js") {
			const me = this;
			me.worker = new Worker("http://" + host + ":" + port + path);
			me.socket = me.worker;
			me.socket.onmessage = (message) => {
				const response = me.createResponse(message.data);
			  	me.onmessage(message.data,response);
			}
			return Promise.resolve();
		}
	}
	class DexterousSharedWorker extends Dexterous {
		constructor(options) {
			super(options);
		}
		listen(port=window.location.port,host=window.location.hostname,path="/dexterous/worker.js") {
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
	class DexterousBrowserServer extends Dexterous {
		constructor(options) {
			super(options);
		}
		listen(worker) {
			const me = this;
			if(typeof(DedicatedWorkerGlobalScope)!=="undefined" && worker instanceof  DedicatedWorkerGlobalScope) {
				worker.onmessage=function(message){
					const response = me.createResponse(message.data,this);
					me.onmessage(message.data,response);
				}
			} else if(typeof(SharedWorkerGlobalScope)!=="undefined" && worker instanceof SharedWorkerGlobalScope) {
				worker.onconnect=function(e) {
					const port = e.ports[0]; 
					port.onmessage=function(message){
						const response = me.createResponse(message.data,port);
						me.onmessage(message.data,response);
					}
					port.start();
				}
			}
			return Promise.resolve();
		}
	}
	class DexterousClient extends Dexterous {
		constructor(options={}) {
			super(options);
		}
		listen(port,location) {
			const me = this;
			me.location = location;
			let _Worker;
			if(typeof(Worker)!=="undefined") {
				_Worker = Worker;
			}
			if(typeof(Worker)!=="undefined" && me.location instanceof _Worker) {
				me.socket = me.location;
			} else {
				let _WebSocket;
				if(ONSERVER) {
					const r = require;
					_WebSocket = r("ws");
				} else {
					_WebSocket = WebSocket;
				}
				try {
					me.socket = new _WebSocket("ws://" + me.location + (port ? ":"+port : ""),me.options.protocols);
				} catch(e) {
					me.onerror(e);
				}
			}
			me.socket.onmessage = function(message) {
				try {
					message = (typeof(message.data)==="string" ? JSON.parse(message.data) : message.data);
					message.headers || (message.headers={});
				} catch(e) {
					// ignore;
				}
				const response = new DexterousResponse(me.socket,message);
				me.onmessage(message,response); 
			}
			me.socket.onerror = function() { 
				me.onerror(...arguments); 
			}
			return new Promise((resolve,reject) => {
				me.socket.onopen = function (event) {
					resolve();
				};
				if(typeof(Worker)!=="undefined" && me.location instanceof _Worker) {
					resolve();
				}
				me.socket.onclose = function(event) {
					me.listen(port,me.location);
				}
				console.log("Dexterous client listening on: ws://" + me.location + (port ? ":"+port : ""));
			});
		}
	}
	Dexterous.Response = DexterousResponse;
	Dexterous.Client = DexterousClient;
	if(ONSERVER) {
		const r = require;
		Dexterous.Server = r("./server.js")({Dexterous});
		module.exports = Dexterous;
	} else {
		if(typeof(Worker)!=="undefined") {
			Dexterous.Worker = DexterousWorker;
		}
		if(typeof(SharedWorker)!=="undefined") {
			Dexterous.SharedWorker = DexterousSharedWorker;
		}
		Dexterous.Server = DexterousBrowserServer;
		this.Dexterous = Dexterous;
	}
}).call(this);