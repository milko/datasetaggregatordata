'use strict';

const dd = require('dedent');
const fs = require('fs');
const stream = require('stream');
const readline = require('readline');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('test');


router.get(function (req, res) {

	const path = module.context.basePath;
	const file = path + '/test.json';
	let data = [];

	// try {
		let lineReader = readline.createInterface({
			input: fs.createReadStream(file)
		});

		lineReader.on('line', (line) => {
			// const obj = JSON.parse(line);
			data.push(line);
		});
	// } catch(e) {
	// 	res.throw(e);
	// }


	res.send({
		success: true,
		data: data
	});
}, 'list')
	.summary('Test')
	.description(dd`
  Test.
`);
