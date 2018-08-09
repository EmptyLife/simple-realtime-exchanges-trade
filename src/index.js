
const EventEmitter = require('events')

const SimpleWebSocket = require('simple-web-socket-client-reconnect');
const assert = require("assert")

const exchanges = {
	bitmex: require("./exchanges/bitmex"),
	bitfinex: require("./exchanges/bitfinex"),
	huobi: require("./exchanges/huobi"),
	binance: require("./exchanges/binance"),
	gdax: require("./exchanges/gdax"),
	hitbtc: require("./exchanges/hitbtc"),

	// sv time sec
	bitstamp: require("./exchanges/bitstamp"),
	okex: require("./exchanges/okex"),
};

class ExchangesRealtime extends EventEmitter {
	constructor(options) {
		super();
		
		this.options = {
			...options,
			
			exchanges: {
				...options.exchanges
			}
		};
		
		this.exchanges = {};
		for(let exchangeName in this.options.exchanges) {
			const exchange = this.constructor.exchanges[exchangeName];
			assert(exchange, `Unk. exchange "${exchangeName}"`)
			
			const exchangeOptions = this.options.exchanges[exchangeName];
			
			this.exchanges[exchangeName] = this._newExchange(exchange, exchangeName, exchangeOptions);
		}
	}
	_newExchange(exchange, exchangeName, exchangeOptions) {
		const options = {
			...this.options,
			subscribe: {
				...exchangeOptions
			}
		};
		
		const exchangeInst = new exchange(options);
		
		for(let table in exchangeOptions) {
			const symbols = exchangeOptions[table];
			for(const symbol of symbols) {
				const info = {event: table, exchange: exchangeName, symbol};
				exchangeInst.on(`${table}:${symbol}`, (data) => {
					this.emit(`${table}:${exchangeName}:${symbol}`, info, data);
					this.emit(`${table}:${exchangeName}:*`, info, data);
					this.emit(`${table}:*:*`, info, data);
					this.emit(`any`, info, data);
				});
				
				{
					table += "-realtime";
					const info = {event: table, exchange: exchangeName, symbol};
					exchangeInst.on(`${table}:${symbol}`, (data) => {
						this.emit(`${table}:${exchangeName}:${symbol}`, info, data);
						this.emit(`${table}:${exchangeName}:*`, info, data);
						this.emit(`${table}:*:*`, info, data);
						this.emit(`any`, info, data);
					});
				}
			}
		}
		
		["open", "close", "error", "reopen", "ping"].forEach(eventName => exchangeInst.on(eventName, (...args) => {
			const info = {event: eventName, exchange: exchangeName, symbol: null};
			this.emit(`${eventName}:${exchangeName}`, info, ...args);
			this.emit(`${eventName}:*`, info, ...args);
			this.emit(`any`, info, ...args);
		}));
		
		return exchangeInst;
	}
	
	close() {
		for(const exchangeName in this.exchanges) {
			this.exchanges[exchangeName].close();
		}
	}
}
ExchangesRealtime.exchanges = exchanges;



module.exports = ExchangesRealtime;
