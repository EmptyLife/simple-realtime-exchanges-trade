
const EventEmitter = require('events')
const {RealtimePrototype} = require("../../lib/exchange");

const URL = "wss://api.bitfinex.com/ws/2";
class Realtime extends RealtimePrototype {
	constructor(options) {
		super(URL, options);

		
		this.pairOfChannelId = new Map();

		this.on("open", () => {
			this.pairOfChannelId.clear();
			
			for(let symbol of this.options.subscribe.trade) {
				symbol = symbol.toUpperCase();
				
				this.sendJson({ 
					event  : 'subscribe', 
					channel: 'trades', 
					pair : symbol,
				});
			}
		});

		this.on("message:json", (msg) => {
			if ( Array.isArray(msg) ) {
				this._parseDataArray(msg);
			} else if ( msg instanceof Object ) {
				if ( "event" in msg ) {
					this._parseEvent(msg);
				}
			}
		});
		
		///////////////////////
		this.on("_:send:ping", () => {
			this.isOpened() && this.sendJson({event: "ping", cid: Date.now()});
		});
	}

	_sendPing() {
		this.isOpened() && this.sendJson({event: "ping", cid: Date.now()});
	}
	
	_parseEvent(msg) {
		if ( msg.event === "subscribed" ) {
			this.pairOfChannelId.set(msg.chanId, msg);
		}
		
		if ( msg.event === "ping" ) {
			this.isOpened() && this.sendJson({event: "pong", ts: Date.now(), cid: msg.cid});
		}
		if ( msg.event === "pong" ) {
			this.emit("_:recv:pong", msg);
		}
	}
	_parseDataArray(msg) {
		const info = this.pairOfChannelId.get(msg[0]);
		if ( info ) {
			
			if ( info.channel === "trades" ) {
				if ( Array.isArray(msg[1]) ) {
					this._insertTradeArray(msg[1], info.pair, false);
				} else {
					switch(msg[1]) {
						case "te":
							this._insertTradeArray([msg[2]], info.pair, true);
							break;
					}
				}
			}
			
		}
	}
	_insertTradeArray(srcArray, symbol, realtime = true) {
		const dstArray = [];
		for(const trade of srcArray) {
			dstArray.push([
				+trade[3],
				+trade[2],
				+trade[1],
				Date.now(),
			])
		}
		
		this.emitTrade(symbol, dstArray);
	}
}

module.exports = Realtime;
