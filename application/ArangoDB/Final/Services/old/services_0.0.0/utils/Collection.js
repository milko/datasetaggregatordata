'use strict';

/**
 * Collection info
 */
module.exports = {
	setting	: {
		name : 'settings',
		index: []
	},
	session	: {
		name : 'sessions',
		index: []
	},
	log	: {
		name : 'logs',
		index: []
	},
	message	: {
		name : 'messages',
		index: []
	},

	user	: {
		name : 'users',
		index	: [
			{
				fields:	[ 'username' ],
				type:	'hash',
				unique:	true,
				sparse:	false
			},
			{
				fields:	[ 'email' ],
				type:	'hash',
				unique:	true,
				sparse:	false
			}
		]
	},
	group	: {
		name : 'groups',
		index: []
	},
	hierarchy	: {
		name : 'hierarchies',
		index: []
	},

	term	: {
		name : 'terms',
		index: [
			{
				fields:	[ 'nid' ],
				type:	'hash',
				unique:	false,
				sparse:	true
			},
			{
				fields:	[ 'lid' ],
				type:	'hash',
				unique:	false,
				sparse:	false
			},
			{
				fields:	[ 'gid' ],
				type:	'skiplist',
				unique:	true,
				sparse:	false
			},
			{
				fields:	[ 'var' ],
				type:	'skiplist',
				unique:	true,
				sparse:	true
			},
			{
				fields:	[ 'syn[*]' ],
				type:	'skiplist',
				unique:	false,
				sparse:	true
			},
			{
				fields:	[ 'keyword[*]' ],
				type:	'skiplist',
				unique:	false,
				sparse:	true
			},
			{
				fields:	[ 'instances[*]' ],
				type:	'hash',
				unique:	false,
				sparse:	true
			}
		]
	},
	descriptor	: {
		name : 'descriptors',
		index: [
			{
				fields:	[ 'nid' ],
				type:	'hash',
				unique:	false,
				sparse:	true
			},
			{
				fields:	[ 'gid' ],
				type:	'skiplist',
				unique:	true,
				sparse:	false
			},
			{
				fields:	[ 'var' ],
				type:	'skiplist',
				unique:	true,
				sparse:	false
			},
			{
				fields:	[ 'kind' ],
				type:	'hash',
				unique:	false,
				sparse:	false
			},
			{
				fields:	[ 'type' ],
				type:	'hash',
				unique:	false,
				sparse:	false
			},
			{
				fields:	[ 'format' ],
				type:	'hash',
				unique:	false,
				sparse:	true
			},
			{
				fields:	[ 'unit' ],
				type:	'hash',
				unique:	false,
				sparse:	true
			},
			{
				fields:	[ 'syn[*]' ],
				type:	'skiplist',
				unique:	false,
				sparse:	false
			},
			{
				fields:	[ 'keyword[*]' ],
				type:	'skiplist',
				unique:	false,
				sparse:	true
			},
			{
				fields:	[ 'terms[*]' ],
				type:	'hash',
				unique:	false,
				sparse:	true
			},
			{
				fields:	[ 'fields[*]' ],
				type:	'hash',
				unique:	false,
				sparse:	true
			}
		]
	},
	schema	: {
		name : 'schemas',
		index: [
			{
				fields:	[ '_from', '_to', 'predicate' ],
				type:	'hash',
				unique:	true,
				sparse:	false
			},
			{
				fields:	[ 'branches[*]' ],
				type:	'hash',
				unique:	false,
				sparse:	true
			}
		]
	},

	study	: {
		name : 'studies',
		index: []
	},
	annex	: {
		name : 'annexes',
		index: []
	},
	smart	: {
		name : 'smart',
		index: []
	},
	link	: {
		name : 'links',
		index: []
	},

	toponym	: {
		name : 'toponyms',
		index: []
	},
	shape	: {
		name : 'shapes',
		index: []
	},
	edge	: {
		name : 'edges',
		index: []
	}
};