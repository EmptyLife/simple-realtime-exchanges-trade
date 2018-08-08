
const EventEmitter = require('events')
const Pusher = require("simple-pusher-wrapper");
const {TimeNormalize} = require("../../lib/exchange");

const BITSTAMP_PUSHER_ID = "de504dc5763aeef9ff52";


class Realtime extends EventEmitter {
	constructor(options) {
		super();
		
		this.options = {
			reconnect: true,
			...options,
			
			subscribe: {
				trade: [],
				...options.subscribe,
			}
		};

		this._state = "initialized";
		this._openFn = () => {
			if ( this._state !== "opened" ) {
				if ( this._state === "closed" ) {
					this.emit("reopen");
					this.emit("reconnect");
				}
				this.emit("open");
			}
			this._state = "opened";
		};
		this._closeFn = () => {
			if ( this._state !== "closed" ) {
				this.emit("close");
			}
			this._state = "closed";
		};
		
		this.pusher = new Pusher(BITSTAMP_PUSHER_ID);
		this.pusher.connection.bind('connected', this._openFn.bind(this));
		this.pusher.connection.bind('initialized', this._closeFn.bind(this));
		this.pusher.connection.bind('connecting', this._closeFn.bind(this));
		this.pusher.connection.bind('unavailable', this._closeFn.bind(this));
		this.pusher.connection.bind('failed', this._closeFn.bind(this));
		this.pusher.connection.bind('disconnected', this._closeFn.bind(this));
		
		for(let symbol of this.options.subscribe.trade) {
			this.bindSymbolTrade(symbol);
		}		
	}
	
	reopen() {}
	reconnect() {}
	isOpened() {return this._state === "opened";}
	isClosed() {return this._state === "closed";}
	close() {
		this.pusher.disconnect();
	}
	
	bindSymbolTrade(symbol) {
		symbol = symbol.toUpperCase();
		
		let subscribe = "live_trades" + (symbol === "BTCUSD" ? "" : "_"+symbol);

		const channel = this.pusher.subscribe(subscribe);
		
		const timeNormalize = new TimeNormalize();
		channel.bind('trade', (data) => {
			timeNormalize.update();
			
			const trade = [
				+data.price,
				data.type === 1 ? -+data.amount : data.amount,
				timeNormalize.normalize(+new Date((+data.timestamp)*1e3)),
				Date.now()
			];
			
			this.emit(`trade:${symbol}`, [trade]);
        });
		
		channel.bind("pusher:subscription_succeeded", (...args) => {
		//	console.log("pusher:subscription_succeeded")
		});
		channel.bind("pusher:subscription_error", (...args) => {
		//	console.log("pusher:subscription_error")
		});
	}
}

module.exports = Realtime;
