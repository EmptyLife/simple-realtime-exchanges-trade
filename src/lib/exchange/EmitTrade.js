
const EventEmitter = require("events")

const MIN_EMIT_TRADE_COUNT = 1;

class EmitTrade extends EventEmitter {
	constructor() {
		super();
		
		this._emitTradeContext = {
			emitTradeCount: 0,
			openedTime: null,
		};
		
		this.on("open", () => {
			this._emitTradeContext.emitTradeCount = 0;
			this._emitTradeContext.openedTime = Date.now();
		});
	}
	
	emitTrade(symbol, array) {
		this.emit(`trade:${symbol}`, array, symbol);
		this.emit(`trade:*`, array, symbol);
		
		this._emitTradeRealtime(symbol, array);
	}
	
	_emitTradeRealtime(symbol, array) {
		if ( !array.length ) {return;}
		
		//this._emitTradeContext.emitTradeCount++;
		//if ( this._emitTradeContext.emitTradeCount <= MIN_EMIT_TRADE_COUNT ) {return;}
		
		if ( !this._emitTradeContext.openedTime ) {return;}
		
		if ( array[0][2] <= this._emitTradeContext.openedTime ) {
			console.log("skip old ata", symbol, new Date(array[0][2]), new Date(this._emitTradeContext.openedTime) );
			return;
		}

		console.log("go to");
			
		this.emit(`trade-realtime:${symbol}`, array, symbol);
		this.emit(`trade-realtime:*`, array, symbol);
	}
}

module.exports = EmitTrade;
