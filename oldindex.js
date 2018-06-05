var URL;
if(typeof(module)!=="undefined") {
	URL = require("url").URL;
}

	Object.defineProperty(URL.prototype,"query",{enumerable:true,configurable:true,
		get() { 
			if(this.search) {
				const querystring = this.search.substring(1),
					parts = querystring.split("&"),
					query = {};
				if(parts.length>0) {
					for(const part of parts) {
						let [key,value] = part.split("=");
						if(key && value) {
							try {
								value = JSON.parse(value);
							} catch(e) {
								;
							}
						}
						query[key] = value;
					}
				}
				return query;
		 }}});


		class Body {
			constructor(response) {
				Object.defineProperty(this,"response",{enumerable:false,configurable:true,writable:true,value:response});
				this.data = "";
			}
			write(data) {
				this.data += data;
			}
			async text() {
				this.response.finished = true;
				return this.data;
			}
			async json() {
				this.response.finished = true;
				return JSON.parse(this.data);
			}
		}
		
		function normalizeHeaders(request) {
			if(!request.getHeader) {
				Object.defineProperty(request,"getHeader",{enumerable:false,configurable:true,writable:true,value:function(key) { return this.headers.get(key); }});
				Object.defineProperty(request,"setHeader",{enumerable:false,configurable:true,writable:true,value:function(key) { return this.headers.set(key,value); }});
			}
			if(!request.headers.get) {
				Object.defineProperty(request.headers,"get",{enumerable:false,configurable:true,writable:true,value:function(key) { return this[key]; }});
			}
			if(!request.headers.set) {
				Object.defineProperty(request.headers,"set",{enumerable:false,configurable:true,writable:true,value:function(key,value) { return this[key] = value; }});
			}
			if(!request.headers.method) request.headers.set("method","GET");
			if(request.headers.keys) { 
				request.headers.keys().forEach(key => { 
					if(!request.headers[key]) {
						Object.defineProperty(request.headers,key,{enumerable:true,configurable:true,get:function(key){ return this.get(key)}, set:function(key,value) { this.set(key,value);}});
					}
				});
			}
		}

		class BrowserResponse {
			constructor() {
				this.finished  = false;
				this.headersSent = false;
				Object.defineProperty(this,"headers",{enumerable:true,configurable:true,writable:true,value:new Headers({})});
				Object.defineProperty(this,"body",{enumerable:true,configurable:true,writable:true,value:new Body(this)});
				Object.defineProperty(this,"status",{enumerable:true,configurable:true,writable:true,value:200});
			}
			Response() {
				return new Response(this.body.data,{status:this.status,statusText:this.statusText,headers:this.headers});
			}
			appendHeader(key,value) {
				if(this.headersSent  || this.finished) {
					throw new Error("BrowserResponse headers already sent")
				}
				this.headers.append(key,value);
			}
			end(data) {
				if(data!==undefined) {
					this.body.write(data);
				}
				this.finished = true;
			}
			getHeader(key) {
				return this.headers.get(key);
			}
			async json() {
				return this.body.json();
			}
			removeHeader(key) {
				this.headers.delete(key);
			}
			setHeader(key,value) {
				if(this.headersSent  || this.finished) {
					throw new Error("BrowserResponse headers already sent")
				}
				this.headers.set(key,value);
			}
			async text() {
				return this.body.text();
			}
			write(data) {
				if(this.finished) {
					throw new Error("BrowserResponse body is closed")
				}
				this.headersSent = true;
				this.body.write(data);
			}
			writeHead(statusCode,statusMessage,headers={}) {
				if(statusMessage && typeof(statusMessage)==="object") {
					headers = statusMessage;
					statusMessage = null;
				}
				this.status = statusCode;
				for(const key in headers) {
					this.setHeader(key,headers[key]);
				}
			}
			
		}

	function runAsServiceWorker(options) {
		navigator.serviceWorker.register(options.path,options)
	  .then(function(reg) {
	    console.log(`Dexterous running ${options.path}. Scope is ${reg.scope}`);
	  }).catch(function(error) {
	    console.log(`Dexterous run ${options.path} failed with ${error}`);
	  });
	}
	function runAsBrowser(options) {
		for(const ename of ["hashchange","beforeunload"]) {
			window.addEventListener(ename, async event => {
 				const referrer = ename==="hashchange" ? event.oldURL : event.target.URL,
					target = ename==="hashchange" ? event.newURL : event.target.activeElement.href,
					oldURL = new URL(referrer),
					newURL = target ? new URL(target) : null;
				if(options && options.scope && newURL && newURL.pathname.indexOf(options.scope)!==0) {
					return;
				}
				if(oldURL.hash==="" || (newURL && oldURL.href.replace(oldURL.hash,newURL.hash)===newURL.href)) {
					const response = new BrowserResponse();
					event.preventDefault();
					await this.onRequest(new Request(event.newURL,{method:"GET",referrer}),response);
  				const status = parseInt(response.status),
  					text = await response.text();
  				if(status===200 || status===201) {
  					const location = new URL(target),
  						element = document.getElementById(location.hash.substring(1));
  					if(element) {
  						element.innerHTML = text;
  					} else {
  						document.body.innerHTML = text;
  					}
  					const title = response.headers.get("title"); // should this be something like "document-title"
  					if(title) {
  						window.document.title = title;
  					}
  				} else if(status===205) {
  					window.location.reload();
  				} else if([301,302,303,307,308].includes(status)) {
  					window.location.href = text;
  				} else {
  					throw new Error(`Request Error: ${status} ${text}`);
  				}
				}
			})
		}
	}
	function runAsHttpServer(port,options) {
		if(options && options.scope) {
			this.use()
		}
		const http = require("http");
	  this.httpServer = http.createServer((request,response) => this.onRequest(request,response));
	  this.httpServer.listen(port, (err) => {
	      if (err) {
	        return console.log('something bad happened', err)
	      }
	      console.log(`server is listening on ${port}`)
	  });
	}
	const mimeTypes = {
   	 "css": "text/css",
  	 "gzip": "application/gzip",
  	 "gif": "image/gif",
  	 "htm": "text/html",
  	 "html": "text/html",
  	 "ico": "image/x-icon",
  	 "jpg": "image/jpeg",
  	 "jpeg": "image/jpeg",
  	 "js": "application/javascript",
  	 "json": "application/json",
  	 "mp4": "video/mp4",
  	 "mp4v": "video/mp4",
  	 "mpg4": "video/mp4",
  	 "mpg": "video/mpeg",
  	 "mpeg": "video/mpeg",
  	 "pdf": "applicaion/pdf",
  	 "png": "image/png",
  	 "txt": "text/plain",
  	 "wsdl": "application/wsdl+xml",
  	 "xml": "application/xml",
  	 "xsl": "application/xml"
	}
	class Dexterous {
	  constructor(options={}) {
	  	Object.assign(mimeTypes,options.mimeTypes);
	  	this.handlers = [];
	    this.use((request,response,next) => {
	    	try {
	    		normalizeHeaders(request);
	    		request.app = this;
	    		request.protocol = request.url.indexOf("://")>=0 ? request.url.substring(0,request.url.indexOf(":")) : (request.connection.secure ? "https" : "http");
	    		const url = request.url.indexOf("://")>=0 ? request.url : `${request.protocol}://${request.headers.host}${request.url}`;
	    		request.location = new URL(url);
	    		let body = [];
	    		request.on('data', (chunk) => {
	    		  body.push(chunk);
	    		}).on('end', () => {
	    		  const type = request.headers.get("Content-Type");
	    		  request.body = Buffer.concat(body);
	    		  if(type) {
	    		  	const i = type.lastIndexOf("/");
		    		  if(type.indexOf("text/")===0 || type.indexOf("/javascript")===i || type.indexOf("/json")===i || type.indexOf("/xml")===i || type.indexOf("/wsdl+xml")===i) {
		    		  	request.body = request.body.toString();
		    		  }
		    		  if(type.indexOf("/json")) {
		    		  	try {
		    		  		request.body = JSON.parse(request.body);
		    		  	} catch(e) {
		    		  		;
		    		  	}
		    		  }
	    		  }
	    		  next();
	    		});
	    	} catch(e) {
	    		next(e);
	    	}
	    });
	    if(typeof(self)!=="undefined" && typeof(window)==="undefined") {
	  		console.log("Dexterous listening ...")
	  		self.addEventListener('fetch', event => {
	  			 event.waitUntil(this.onRequest(event.request,new BrowserResponse())
	  					 .then(response => {
	  							 event.respondWith(response.Response());
	  					 }))
	  		});
	  	}
	  }
	  run(port=typeof(module)!=="undefined" ? 8080 : null,options={scope:"/"}) {
	  		if(options.static) {
	  			this.use(require("./middleware/staticrouter")(options.static));
	  		}
	  		if(typeof(window)!=="undefined"){
	  			if(port===navigator.serviceWorker) {
	  			  runAsServiceWorker.call(this,options);
	  			} else {
	  				runAsBrowser.call(this,options);
	  			}
	  		} else if(typeof(module)!=="undefined") {
	  			runAsHttpServer.call(this,port,this.options);
	  		}
	  		return this;
	  }
	  delete(match,...handlers) {
	  	return this.use(request => request.headers.method==="DELETE" && match(request),...handlers);
	  }
	  get(match,...handlers) {
	  	if(match===null) match = () => true;
	  	if(arguments.length===1) {
	  		handlers = [match];
	  		match = () => true;
	  	}
	  	return this.use(request => request.headers.method==="GET" && match(request),...handlers);
	  }
	  get mimeTypes() {
	  	return Object.assign({},mimeTypes);
	  }
	  async onRequest(request,response) {
	  	if(!response.send) {
	  		Object.defineProperty(response,"send",{enumerable:false,configurable:true,writable:true,value:(data) => { response.end(data); }});
	  	}
	  	if(!response.status) {
	  		Object.defineProperty(response,"status",{enumerable:false,configurable:true,writable:true,value:function(statusCode) { response.statusCode = statusCode; return this; }});
	  	}
	  	const generators = [];
	  	let err, next;
	  	for(const handler of this.handlers) {
	  		next = await handler(request,response,err);
	  		if(!next) break;
	  		if(typeof(next)==="object" && next instanceof Error) err = next;
	  	}
	  	if(!response.finished) {
		  	if(!response.headersSent) {
		  		response.statusCode = 404;
		  		response.statusMessage = "Not Found";
		  	}
		  	response.end("Not Found");
	  	}
	  }
	  patch(match,...handlers) {
	  	return this.use(request => request.headers.method==="PATCH" && match(request),...handlers);
	  }
	  post(match,...handlers) {
	  	return this.use(request => request.headers.method==="POST" && match(request),...handlers);
	  }
	  put(match,...handlers) {
	  	return this.use(request => request.headers.method==="PUT" && match(request),...handlers);
	  }
	  use(match,...handlers) {
	    if(arguments.length===1) {
	    	if(typeof(match)!=="function" || match.length<2) {
	    		throw new TypeError("'match' must be a handler function taking at least 2 arguments if 'use' only has one argument")
	    	}
	    	const handler = match; 
	    	handlers = [handler]; 
	    	match = () => true;
	    }
	    const type = typeof(match);
	    if(match && type=="object" && match instanceof RegExp) {
	    	const regexp = match;
	    	match = request => regexp.test(request.location.pathname);
	    } else if(type==="string") {
	    	const string = match;
	    	match = request => request.location.pathname.indexOf(string)===0;
	    } else if(type!=="function") {
	    	throw new TypeError("'match' must be a string or a function or RegExp");
	    }
	    const f = async function(request,response,err) {
	    	if(match(request)) {
	  			let next;
	  			const promise = new Promise(resolve => next = (arg=true) => resolve(arg));
	    		for(const handler of handlers) {
	    			try {
	    				if(handler.length===4) {
	    					if(err) {
	    						await handler(err,request,response,next);
	    					}
	    				} else {
	    					await handler(request,response,next);
	    				}
	    			} catch(e) {
	    				next(e);
	    			}
	    			const result = await promise;
	    			if(result!==true) return result;
	    		}
	    	}
    		return true;
	    }
	    this.handlers.push(f);
	    return this;
	  }
	}
	const dexterous = new Dexterous();
	dexterous.use((request,response,next) => {
		response.setHeader("title","Test Title Set");
		next();
	});
	dexterous.get((request,response,next) => {
		console.log(request.location);
		next();
	});
	if(typeof(module)!=="undefined") {
		dexterous.use(require("./middleware/staticrouter")(__dirname));
		dexterous.use(require('express-markdown')({directory: __dirname}));
	}
	if(typeof(module)!=="undefined") {
		dexterous.run(8080);
	}
