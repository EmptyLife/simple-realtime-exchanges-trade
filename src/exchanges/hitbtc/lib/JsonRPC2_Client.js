
const EventEmitter = require("events")

class JsonRPC2_Client extends EventEmitter {
	constructor(transport) {
		super();
		
		this.id = 1;
		this.map = new Map();
		
		const noop = () => 0;

		const transportEvents = [
			["message", this._parseMessage.bind(this)],
			["open", () => {
				this.send = (msg) => transport.send(JSON.stringify(msg));
			}],
			["close", () => {
				for(const [id, ctx] of this.map) {
					ctx.reject(new Error("Transport closed"));
				}
				
				this.map.clear();
				this.send = noop;
			}],
		];
				
		this.send = noop;
				

		this.setEvents(transport, transportEvents);
		
	}
	setEvents(transport, events) {
		events.forEach( event => transport.on(event[0], event[1]) )
	}
	delEvents(transport, events) {
		events.forEach( event => transport.off(event[0], event[1]) )
	}
	
	async call(method, params) {
		return new Promise((resolve, reject) => {
			const id = ++this.id;
			
			this.map.set(id, {resolve, reject, time: Date.now()});
			
			this.send({method, id, params});
		});
	}
	
	_parseMessage(msg) {
		try {
			msg = JSON.parse(msg);
		} catch(e) {
			this.emit("error", new Error("Invalid data"));
			return;
		}
		const data = msg;
		
		if ( !( data instanceof Object ) ) {
			this.emit("error", new Error("Invalid data"));
			return;
		}

		if ( "id" in data ) {
			if ( ("method" in data) && ("params" in data) ) {
				return;
			}
			
			return this._parseAnswer(data);
		}
		
		if ( ("method" in data) && ("params" in data) ) {
			return this._parseNotify(data);
		}
		
		if ( "error" in data ) {
			this.emit("error", data.error);
			return;
		}
	}
	_parseAnswer(data) {
		const ctx = this.map.get(data.id);
		if ( !ctx ) {
			this.emit("error", new Error("Unk. id"));
			return;
		}

		if ( "error" in data ) {
			ctx.reject(data.error);
			return;
		}

		ctx.resolve(data.result);
	}
	_parseNotify(data) {
		this.emit("notify", data.method, data.params);
		this.emit("notify:"+data.method, data.params);
	}
}

module.exports = JsonRPC2_Client;
