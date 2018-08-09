
const assert = require("assert")

class ExchangeOptions {
	constructor(options) {
		options = {
			reconnect: true,
			
			heartbeat: true,
			msg_timeout: 5e3,
			ping_timeout: 5e3,
			ping_timeinterval: 1e3,
			
			...options,
			
			subscribe: {
				trade: [],
				
				...options.subscribe
			}
		};
		
		options.subscribe = {
			trade: options.subscribe.trade
		};
		
		if ( !Array.isArray(options.subscribe.trade) ) {
			options.subscribe = [options.subscribe];
		}
		
		options.subscribe.trade.forEach(symbol => assert(typeof symbol === "string", "Invalid options(options.subscribe.trade, item expected string)"))
		
		Object.assign(this, options)
	}
}

module.exports = ExchangeOptions;
