
const EventEmitter = require('events')
const {RealtimePrototype, Heartbeat, ExchangeOptions} = require("../../lib/exchange");


const URL = "wss://stream.binance.com:9443/stream?streams=";
class Realtime extends RealtimePrototype {
	constructor(options) {
		options = new ExchangeOptions(options);
		
		const newUrl = URL + ["trade"].map(event => {
			const symbols = options.subscribe[event] || [];
			return symbols.map(symbol => {
				return symbol.toLowerCase() + "@" + event;
			}).join("/");
		}).filter(s => s.length).join("/");
		
		super(newUrl, {
			...options,
			heartbeat: false
		});
		
		this.on("message:json", this._parseMsg.bind(this));
	}
	
	_parseMsg(msg) {
		let [symbol, subscribe] = msg.stream.split('@');
		symbol = symbol.toUpperCase();
		
		switch(subscribe) {
			case "trade":
				this._parseTrade(symbol, msg);
				break;
		}
	}
	
	_parseTrade(symbol, msg) {
		const data = msg.data;
		
		const trade = [
			+data.p, 
			+data.q,
			+new Date(data.T), 
			Date.now()
		];

		this.emitTrade(symbol, [trade]);
	}
}

module.exports = Realtime;
