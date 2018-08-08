
const EventEmitter = require('events')
const {RealtimePrototype, Heartbeat} = require("../../lib/exchange");
const pako = require('pako')


const URL = "wss://stream.binance.com:9443/stream?streams=";
class Realtime extends RealtimePrototype {
	constructor(options) {
		options = {
			...options,
			subscribe: {
				trade: [],
				...options.subscribe
			}
		};
		
		const newUrl = URL + ["trade"].map(event => {
			const symbols = options.subscribe[event] || [];
			return symbols.map(symbol => {
				return symbol.toLowerCase() + "@" + event;
			}).join("/");
		}).filter(s => s.length).join("/");
		
		console.log(newUrl);
		super(newUrl, {
			...options,
			heartbeat: false
		});
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

		this.emit(`trade:${symbol}`, [trade]);
	}
}

module.exports = Realtime;
