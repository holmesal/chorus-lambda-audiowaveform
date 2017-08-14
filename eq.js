var eq = function equalize(samples) {
	// https://en.wikipedia.org/wiki/Histogram_equalization
	var start = new Date();
	var H = histogram(samples);

	//CDF * (maxVal - 1) mappings
	var cdfMappings = {};
	var lastCount = 0;
	for (var i = 0; i <= 127; i++) {
		var currentCount = lastCount + safeNumber(H[i], 0);
		var cdf = currentCount / samples.length;
		cdfMappings[i] = Math.floor(cdf * 126);
		lastCount = currentCount;
	}

	var eq = samples.map(function(val){
		var absVal = Math.abs(val);
		var sign = val == 0 ? 1 : val/absVal;
		return sign * cdfMappings[absVal]
	})

	var ms = ((new Date()) - start)
	console.log("eq "+ samples.length + " samples in " + ms + " ms at " + samples.length/ms + " samples/ms");

	return eq

}

function histogram(samples) {
	return samples.reduce(function(H, val){
		val = Math.abs(val)
		H[val] = safeNumber(H[val], 0) + 1
		return H
	}, {})
}

function safeNumber(number, defaultValue) {
	return number === undefined ? defaultValue : number;
}

module.exports = eq
