const fs       = require('fs');
const zlib     = require('zlib');
const readline = require('readline');

try {
	let lineReader = readline.createInterface({
		input: fs
			       .createReadStream('/Users/milko/Local/Git/Personal/Current/ontologywrapper/data/JSON/Test/descriptors.json.gz')
			       .pipe(zlib.createGunzip())
	});

	lineReader.on('line', (line) => {
		const doc = JSON.parse(line);
		console.log(doc._id);
	});
} catch(e) {
	throw( "Error!!", e);
}
