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
				this.setHeader("status",204);
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
			me.setHeader("status",status);
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
	DexterousResponse.prototype.end = function(data,wait) { // outside class because "end" seems to be reserved in Edge
		if(this._headerSent) {
			throw new Error("response already sent");
		}
		const type = typeof(data);
		if(!this.headers["content-type"]) {
			if(data && type==="object") {
				this.headers["content-type"] = "application/json";
			} else if(["string","number","boolean"].indexOf(type)>=0) {
				this.headers["content-type"] = "text/plain";
			}
		}
		if(type==="object") { // arguments.length===1
			this.body = data;
		} else if(type!=="undefined"){
			this.write(data);
		}
		
		if(!this.headers.status) {
			this.headers.status = 200;
		}
		return this.client.send(this,wait);
	};
	class Dexterous {
		constructor(options={}) {
			this.waiting = {}; // id map of messages waiting for response
			this.handlers = []; // array of handlers added by this.use
			this.options = options;
			this.options.timeout || (this.options.timeout=10000)
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
			setTimeout(() => {
				if(!response._headerSent) {
					response.writeHead(503);
					response.end("Service Unavailable");
				}
			},me.options.timeout);
			me.handlers.forEach((handler,i) => {
				if(me.options.traceLevel>0 && handler.name) {
					console.log("Initializing",handler.name);
				}
				iterators.push(handler.call(me,request,response,true));
			});
			// go down the handler stack
			let maxi = 0;
			iterators.every((iterator,i) => {
				if(me.options.traceLevel>0 && me.handlers[i].name) {
					console.log("Calling",me.handlers[i].name);
				}
				const result = iterator.next();
				if(result.value) {
					maxi = i;
					return true;
				}
			});
			// go back up the handler stack;
			iterators.slice(0,maxi+1).reverse().forEach((iterator,i) => {
				if(me.options.traceLevel>0 && me.handlers[i].name) {
					console.log("Continuing",me.handlers[i].name);
				}
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
			if(typeof(document)!=="undefined" && document.location && !message.getHeader("referer")) {
				message.setHeader("referer",document.location.href);
			}
			if(expect) {
				let resolver,
					rejector;
				result = new Promise((resolve,reject) => { resolver=resolve; rejector=reject; });
				message.method="GET";
				this.waiting[message.getHeader("messageId")] = resolver;
			}
			if(typeof(document)!=="undefined") {
				message.setHeader("referer",document.location.href);
			}
			Object.defineProperty(message,"_headerSent",{value:true});
			if(typeof(socket.postMessage)==="function") {
				socket.postMessage(message);
			} else {
				socket.send(JSON.stringify(message));
			}
			return result;
		}
		use(handler) {
			handler.server = this;
			const GeneratorFunction = function *(){}.constructor;
			if(handler instanceof GeneratorFunction) {
				this.handlers.push(handler);
			} else {
				this.handlers.push(new Function("handler","return function *"+(handler.name ? handler.name : "")+"() { yield handler.call(undefined,...arguments); }")(handler));
			}
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
			if(typeof(Worker)!=="undefined" && location instanceof _Worker) {
				me.socket = location;
			} else {
				let _WebSocket;
				if(ONSERVER) {
					const r = require;
					_WebSocket = r("ws");
				} else {
					_WebSocket = WebSocket;
				}
				try {
					me.socket = new _WebSocket("ws://" + location + (port ? ":"+port : ""),me.options.protocols);
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
				// not just and ack with no return value
				if(!(message.headers.status===204 && message.headers.responseToMessageId)) {
					const response = new DexterousResponse(me,message,me.socket);
					me.onmessage(message,response); 
				}
			}
			me.socket.onerror = function() { 
				me.onerror(...arguments); 
			}
			if(typeof(me.options.last)==="function") {
				me.use(me.options.last);
			} else {
				me.use(function *(request,response,next) {
					yield next;
					// need to address just acks and ignore generating 501 for them, make sure to do on server also
					if(!response._headerSent){
						if(response.getHeader("status")===204) {
							response.setHeader("content-type","text/plain");
							response.end("");
						} else {
							response.writeHead(501,{"content-type":"text/plain"});
							response.end("Not Implemented");
						}
						
					}
				});
			}
			return new Promise((resolve,reject) => {
				me.socket.onopen = function (event) {
					if(typeof(document)!=="undefined" && document.location) {
						const message = me.createResponse();
						message.writeHead(204,{"referer":document.location.href});
						message.end();
					}
					resolve();
				};
				if(typeof(Worker)!=="undefined" && location instanceof _Worker) {
					resolve();
				}
				me.socket.onclose = function(event) {
					me.listen(port,location);
				}
				console.log("Dexterous client listening on: ws://" + location + (port ? ":"+port : ""));
			});
		}
	}
	Dexterous.Client = DexterousClient;
	if(ONSERVER) {
		const r = require;
		Dexterous.Server = r("./nodejs/server.js")({Dexterous});
		module.exports = Dexterous;
	} else {
		this.Dexterous = Dexterous;
	}
}).call(this);