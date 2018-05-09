'use strict';

/**
 * Constants
 *
 * This module exports all required constants:
 *
 * 	- collection:	Collection names, indexes and collection objects.
 */
module.exports = Object.freeze({

	//
	// Collections.
	//
	//	- name:		Collection name.
	//	- index:	Collection indexes.
	//
	collection : {
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
		},
	},

	//
	// Settings.
	//
	setting : {
		status : {
			key			: 'status',			// Status key.
			app			: 'application',	// Application status key.
			col			: 'collections',	// Collections status key.

			state : {						// Application status:
				ok		: 'OK',				// Application is usable.
				empty	: 'empty'			// Required collections are empty.
			}
		}
	},

	//
	// Users.
	//
	user : {
		sysadm			: 'admin',			// System administrator's username.
		field : {
			name		: 'name',			// User name field name.
			code		: 'username',		// User code field name.
			email		: 'email',			// User e-mail addrress field name.
			lang		: 'language',		// User preferred language field name.
			rank		: 'rank',			// User rank field name.
			role		: 'role',			// User roles field name.
			status		: 'status'			// User status field name.
		},
		param : {
			code		: 'username',		// Username parameter.
			pass		: 'password',		// Password parameter.
			token		: 'token',			//
			user		: 'user'
		},
	}
});
