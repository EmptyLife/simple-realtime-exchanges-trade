
const EventEmitter = require('events')
const {RealtimePrototype} = require("../../lib/exchange");
const JsonRPC2_Client = require("./lib/JsonRPC2_Client");


const URL = "wss://api.hitbtc.com/api/2/ws";
class Realtime extends RealtimePrototype {
	constructor(options) {
		super(URL, options);
		
		const rpc = new JsonRPC2_Client(this);
		rpc.on("error", (error) => 0);
		
		this.on("open", () => {
			for(let symbol of this.options.subscribe.trade) {
				symbol = symbol.toUpperCase();
				rpc.call("subscribeTrades", {symbol}).then(() => {}).catch(() => {});
			}
        });
		
		
		//this.on('message', console.log)
		
		///////////////////////
		this.on("_:send:ping", () => {
			this.isOpened() && this.sendText("ping-text-expected-error-adherhgso");
		});
		rpc.on("error", (error) => {
			( error.code === 1 && error.message === "Invalid json" ) && this.emit("_:recv:pong");
		});
		
		
		rpc.on("notify:snapshotTrades", (msg) => this._parseTrade(msg, false));
		rpc.on("notify:updateTrades", (msg) => this._parseTrade(msg, true));
	}

	_parseTrade(msg, realtime = true) {
		function toArray(msg) {
			const array = [];
			for(const item of msg.data) {
				let trade = [
					+item.price, 
					+item.quantity, 
					item.side === "sell" ? -+item.quantity : +item.quantity,
					+new Date(item.timestamp), 
					Date.now()
				];
				
				array.push(trade);
			}
			return array;
		}
		
		const symbol = msg.symbol;
		const array = toArray(msg);

		this.emit(`trade:${symbol}`, array);
	}
}

module.exports = Realtime;
