const EventEmitter = require('events')
const {RealtimePrototype} = require("../../lib/exchange");
const pako = require('pako')



const URL = "wss://api.huobi.pro/ws";
class Realtime extends RealtimePrototype {
	constructor(options) {
		super(URL, options);

		
		
		///////////////////////
		this.on("_:send:ping", () => {
			this.isOpened() && this.sendJson({ping: Date.now()});
		});
		
		this.on("open", () => {
			for(let symbol of this.options.subscribe.trade) {
				symbol = symbol.toLowerCase();
				this.sendJson({"sub": `market.${symbol}.trade.detail`, "id": `${symbol}`});
			}
		});

		this.on("message:binary", (msg) => {
			try {
				msg = JSON.parse(pako.inflate(msg, {to: 'string'}));
				
				if ( msg.ping ) {
					this.isOpened() && this.sendJson({pong: msg.ping});
				} else if ( msg.pong ) {
					this.emit("_:recv:pong", msg);
				} else if ( msg.tick ) {
					this._parse(msg);
				} else {
				}
				
			} catch(e) {}
		});
	}
	
	_parse(msg) {
		let [type, symbol, channel] = msg.ch.split('.');
		
		symbol = symbol.toUpperCase();
		
		switch(channel) {
			case "trade":
				this._parseTrade(symbol, msg.tick.data);
				break;
				
		}
	}
	_parseTrade(symbol, srcArray) {
		const dstArray = [];
		for(const trade of srcArray) {
			dstArray.push([
				+trade.price,
				trade.direction === "sell" ? -trade.amount : trade.amount,
				+new Date(trade.ts), 
				Date.now()
			]);
		}
		
		this.emitTrade(symbol, dstArray);
	}
}

module.exports = Realtime;