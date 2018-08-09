
const SimpleWebSocket = require('simple-web-socket-client-reconnect');
const assert = require("assert")
const EventEmitter = require("events")
const Heartbeat = require("simple-realtime-helper-heartbeat")
const ExchangeOptions = require("./ExchangeOptions")
const EmitTrade = require("./EmitTrade")


class RealtimePrototype extends EmitTrade {
	constructor(url, options) {
		super();
		
		this.options = new ExchangeOptions(options);

		this._webSocket = new SimpleWebSocket(url, {reconnect: this.options.reconnect});
		
		for(const eventName of ["open", "close", "reopen", "error"]) {
			this._webSocket.on(eventName, (...args) => this.emit(eventName, ...args));
		}
		
		this._webSocket.on("message", (msg) => {
			if ( typeof msg === "string" ) {
				let obj, isObj = false;
				try {
					obj = JSON.parse(msg);
					isObj = true;
				} catch(e) {}
				
				isObj && this.emit("message:json", obj);
				this.emit("message:text", msg);
			} else {
				this.emit("message:binary", msg);
			}
			
			this.emit("message", msg);
		});
	
	
	
		/////////////////////// Heartbeat
		if ( this.options.heartbeat ) {
			const heartbeat = new Heartbeat(this, this.options);
			this.on("_:recv:pong", (msg) => {
				heartbeat.emit("recv:pong", msg);
			});		
			heartbeat.on("send:ping", () => {
				this.emit("_:send:ping");
			});
			heartbeat.on("ping", (info) => {
				this.emit("ping", {time: info.time, ping: info.ping});
			});
			heartbeat.on("reconnect", () => {
				this.isOpened() && this.emit("error", new Error("Socket ping timeout"));
				this.reopen();
			});
		}
	
	}
	
	send(msg) {
		this._webSocket.send(msg);
	}
	sendText(msg) {
		this._webSocket.send(msg);
	}
	sendJson(msg) {
		this._webSocket.send(JSON.stringify(msg));
	}
	sendBinary(msg) {
		this._webSocket.send(msg);
	}

	isOpened(...args) {return this._webSocket.isOpened(...args);}
	isClosed(...args) {return this._webSocket.isClosed(...args);}
	reopen(...args) {return this._webSocket.reopen(...args);}
	reconnect(...args) {return this._webSocket.reconnect(...args);}
	close() {
		return this._webSocket.close();
	}
}

module.exports = RealtimePrototype;
