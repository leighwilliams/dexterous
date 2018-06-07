const Dexterous = require("../../dist/dexterous.js");
const dx = new Dexterous({trace:1,log:console});
dx.use(
	  function(value) {
	  	console.log("Message Recieved:",value);
	  	return value;
	  }
);
dx.listen(self,{events:["message"]});



