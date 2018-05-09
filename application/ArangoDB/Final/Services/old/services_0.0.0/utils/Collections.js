'use strict';

const Collection = require( './Collection' );

/**
 * Collection groups
 */
module.exports = {
	document : [
		Collection.setting,
		Collection.message,
		Collection.session,
		Collection.log,
		Collection.term,
		Collection.descriptor,
		Collection.user,
		Collection.group,
		Collection.study,
		Collection.annex,
		Collection.smart,
		Collection.toponym,
		Collection.shape
	],
	edge : [
		Collection.schema,
		Collection.hierarchy,
		Collection.link,
		Collection.edge
	]
};
