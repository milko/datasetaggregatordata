'use strict';

const db = require('@arangodb').db;						// Database framework.

module.exports = class Test
{
	static get name() {
		return({
			term : 'terms'
		});
	}

	static get collection() {
		return({
			term : db._collection( this.name.term )
		});
	}

	static get test() {
		return({
			name : 'terms',
			index : [ 'index' ],
			collection : db._collection( this.test.name )
		});
	}

};
