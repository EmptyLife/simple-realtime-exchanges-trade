
const EventEmitter = require('events')
const {RealtimePrototype} = require("../../lib/exchange");


const URL_DEF = "wss://ws-feed.gdax.com";
const URL_PRO = "wss://ws-feed.pro.coinbase.com";
const URL_PRIME = "wss://ws-feed.prime.coinbase.com";
const URL = URL_DEF;
class Realtime extends RealtimePrototype {
	constructor(options) {
		super(URL, options);
		
		this.on("open", () => {
			for(const symbol of this.options.subscribe.trade) {
				this.sendJson({
					type: "subscribe",
					channels: [{
						name: "ticker",
						product_ids: [symbol]
					}]
				});
			}
        });
		
		///////////////////////
		this.PINGID = "ping-emu-error-expected-ns03podlsbnrges";
		this.on("_:send:ping", () => {
			this.isOpened() && this.sendText(this.PINGID);
		});
		
		this.on("message:json", this._parseMsg.bind(this));
	}

	_parseMsg(msg) {
		if ( msg.type === "ticker" ) {
			const symbol = msg.product_id;
			
			if ( !(msg.price && msg.side && msg.last_size && msg.time) ) {return;}
			
			const trade = [
				+msg.price,
				msg.side === "buy" ? +msg.last_size : -msg.last_size,
				+new Date(msg.time),
				Date.now()
			];

			this.emitTrade(symbol, [trade]);
		} else if ( msg.type === "error" ) {
			if ( msg.original === this.PINGID ) {
				this.emit("_:recv:pong");
			}
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
