
class TimeNormalize {
	constructor(skipCount = 2) {
		this.prevSvTime = null;
		this.prevClTime = null;
		this.clTime = null;
		this.skipCount = skipCount;
	}
	
	update() {
		this.clTime = Date.now();
		this.skipCount--;
	}
	normalize(svTime) {
		if ( this.skipCount >= 0 ) {
			return svTime;
		}
		
		const clTime = this.clTime;
		
		if ( this.prevClTime === null ) {
			this.prevSvTime = svTime;
			this.prevClTime = clTime;
			return svTime;
		}
		
		const svDeltaTime = svTime - this.prevSvTime;
		if ( svDeltaTime >= 1e3 ) {
			this.prevClTime += Math.floor(svDeltaTime / 1e3) * 1e3;
			this.prevSvTime = svTime;
		}
		
		return svTime + clTime - this.prevClTime;
	}
}

module.exports = TimeNormalize;
