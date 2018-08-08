

/**
events
	open
	close
	reconnect

	trade
		[price, qty, timestamp_sv, timestamp_cl]
			side = qty < 0 ? "Sell" : "Buy"

methods
	close
	constructor
		options {
			subscribeTrade: [
				"trade:XBTUSD",
				"trade"
			]
		}
	
	
*/

const SimpleBitmexRealtime = require("simple-bitmex-realtime")
const EventEmitter = require("events")

class Realtime extends EventEmitter {
	constructor(options) {
		super();
		
		this.options = {
			reconnect: true,
			...options,
			
			subscribe: {
				trade: [],
				...options.subscribe
			},
		};
		
		this.realtime = new SimpleBitmexRealtime({reconnect: this.options.reconnect});
		
		for(const eventName of ["open", "close", "reconnect", "reopen", "error", "ping"]) {
			this.realtime.on(eventName, (...args) => this.emit(eventName, ...args));
		}
		this.realtime.on("reconnect", (...args) => this.emit("reopen", ...args));
		
		for(const symbol of this.options.subscribe.trade) {
			this.realtime.subscribe("trade", symbol);
			
			this.realtime.on(`partial@trade:${symbol}`, (array) => {
				this._parseTradeArray(array, symbol, false);
			});
			this.realtime.on(`insert@trade:${symbol}`, (array) => {
				this._parseTradeArray(array, symbol, true);
			});
		}
	}
	
	_parseTradeArray(srcArray, symbol, realtime = true) {
		const dstArray = [];
		for(const item of srcArray) {
			dstArray.push([
				+item.price,
				item.side === "Sell" ? -item.homeNotional : +item.homeNotional,
				+new Date(item.timestamp),
				realtime ? Date.now() : 0,
				item.size
			]);
			
		}

		this.emit(`trade:${symbol}`, dstArray, symbol);
	}
	
	isOpened(...args) {return this.realtime.isOpened(...args);}
	isClosed(...args) {return this.realtime.isClosed(...args);}
	reopen(...args) {return this.realtime.reopen(...args);}
	reconnect(...args) {return this.realtime.reconnect(...args);}
	close() {
		this.realtime.close();
	}
}

module.exports = Realtime;
