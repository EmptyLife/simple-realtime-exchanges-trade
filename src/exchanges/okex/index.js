
const EventEmitter = require('events')
const {RealtimePrototype, TimeNormalize} = require("../../lib/exchange");


const URL_SPOT = "wss://real.okex.com:10441/websocket";
const URL_FUTURES = "wss://real.okex.com:10440/websocket/okexapi";
const URL = URL_SPOT;
class Realtime extends RealtimePrototype {
	constructor(options) {
		super(URL, options);

		
		
		///////////////////////
		this.on("_:send:ping", () => {
			this.isOpened() && this.sendJson({event: "ping"});
		});
		
		this.channels = new Map();
		
		this.on("open", () => {
			for(const _symbol of this.options.subscribe.trade) {
				const symbol = _symbol.toUpperCase();
				
				const channel = `ok_sub_spot_${symbol.toLowerCase()}_deals`;
				
				this.sendJson({event: 'addChannel', channel});
				
				const timeNormalize = new TimeNormalize();
				this.channels.set(channel, (srcArray) => {
					if ( !Array.isArray(srcArray) ) {return;}
					
					const dstArray = [];
					timeNormalize.update();
					const dateJsonPart = (new Date()).toJSON().match(/^.*?T/)[0];
					const now = Date.now();
					for(const item of srcArray) {
						let timestamp = +new Date(dateJsonPart + item[3] + ".000Z") - 8*3600*1e3;
						if ( Math.abs(now - timestamp) > 7*3600*1e3 ) {
							timestamp += (timestamp < now ? +1 : -1) * 24*3600*1e3;
						}
						
						timestamp = timeNormalize.normalize(timestamp);
						
						const trade = [
							+item[1], 
							item[4] === "bid" ? +item[2] : -item[2], 
							timestamp, 
							now
						];
						
						dstArray.push(trade);
					}
					
					this.emitTrade(symbol, dstArray);
				});
				
			}
		});

		this.on("message:json", this._parseMessage.bind(this));
	}
	
	
	_parseMessage(array) {
		if ( Array.isArray(array) ) {
			for(const data of array) {
				if ( data instanceof Object ) {
					this._parseMessageChannel(data);
				}
			}
		}
		
		if ( array instanceof Object ) {
			this._parseMessageMeta(array);
		}
	}
	_parseMessageMeta(data) {
		if ( data.event === "pong" ) {
			this.emit("_:recv:pong");
			return;
		}
		
		if ( data.event === "ping" ) {
			this.isOpened() && this.sendJson({event: "pong"});
			return;
		}
	}
	_parseMessageChannel(item) {
		if ( item.binary === 0 ) {
			const handler = this.channels.get(item.channel);
			handler && handler(item.data);
		}
	}
}

module.exports = Realtime;
