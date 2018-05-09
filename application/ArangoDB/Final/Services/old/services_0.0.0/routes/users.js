'use strict';

/**
 * User related services
 *
 * This set of services deal with user management, they handle all data exchanges
 * that involve a user, including authentication.
 *
 * At initial state, all collections should be empty, including the users collection.
 * All operations require a user to be logged in, which means that the first service
 * that needs to be called is /init, which will create the sysadmin user.
 */

//
// Import frameworks.
//
const dd = require('dedent');							// For multiline text.
const fs = require('fs');								// File system utilities.
const Joi = require('joi');								// Validation framework.
const crypto = require('@arangodb/crypto');				// Cryptographic functions.
const httpError = require('http-errors');				// HTTP errors.
const status = require('statuses');						// Don't know what it is.
const errors = require('@arangodb').errors;				// ArangoDB errors.
const createAuth = require('@arangodb/foxx/auth');		// Authentication framework.
const createRouter = require('@arangodb/foxx/router');	// Router class.

//
// Instantiate application.
//
const User = require( '../utils/User' );				// User constants.
const Event = require( '../utils/Event' );				// Event constants.
const Status = require( '../utils/Status' );			// Status module.
const Setting = require( '../utils/Setting' );			// Settings constants.
const Collection = require( '../utils/Collection' );	// Collection constants.

//
// Import user specific stuff.
//
const SchemaUser = require( '../models/user' );			// User schema.
const SchemaAdmin = require( '../models/admin' );		// Admin init schema.
const db = require('@arangodb').db;						// Database object.
const users = db._collection( Collection.user.name );	// Users collection.
const keySchema = Joi.string().required()				// Document key schema:
	.description('The key of the user');				// required string.

//
// Error constants.
//
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

//
// Instantiate router.
//
const auth = createAuth();
const router = createRouter();
module.exports = router;


//
// Set router tags.
//
router.tag( 'user', 'auth' );


/**
 * Init
 *
 * The service will create the main administrator user.
 *
 * The service should only be invoked if there are no users in the database,
 * it expects the following parameters:
 *
 * 	- token:	A string containing the JWT token as <username><TAB><password>.
 * 	- user:		The user record:
 * 		- name:		The name of the user.
 * 		- pass:		The user password.
 * 		- email:	The user's e-mail address.
 * 		- language:	The user's preferred language code.
 *
 * The service will decode the token and match it with the contents of the
 * auth.json file in the data directory: if the data matches, the user will be
 * stored and logged in with the "admin" username.
 *
 * The service will return { success : true } if successfull.
 *
 * @path		/init
 * @verb		post
 * @request		{Object}	Authentication parameters and administrator user.
 * @response	{Object}	The success parameter set to true.
 */
router.post(
	'/init',					    	// Path.
	(request, response) =>
	{
		//
		// Check if conditions are met.
		//
		if( users.count() === 0 )
		{
			//
			// Check authorisation file.
			//
			const file = module.context.basePath + '/data/auth.json';
			if( fs.isFile( file ) )
			{
				//
				// Load authorisation data.
				//
				let auth_data = null;
				try
				{
					auth_data = JSON.parse( fs.read( file ) );
				}
				catch( error )
				{
					response.throw(
						500,
						"Unable to load authorisation data.",
						error
					);															// !@! ==>
				}

				//
				// Decode token.
				//
				try
				{
					const token = request.body[ User.param.token ];
					const data = crypto.jwtDecode( auth_data.key, token );
					const decoded = JSON.parse( data );

					if( (! decoded.hasOwnProperty( 'code' ))
					 || (! decoded.hasOwnProperty( 'pass' ))
					 || (decoded.code !== auth_data.code)
					 || (decoded.pass !== auth_data.pass) ) {
						response.throw( 403, "Authentication failed." );		// !@! ==>
					}
				}
				catch( error )
				{
					response.throw( 500, error );								// !@! ==>
				}

				//
				// Create user.
				//
				const user = {};
				user[ User.field.code ] = User.default.admin;
				user[ User.field.name ] = request.body.user[ User.field.name ];
				user[ User.field.email ] = request.body.user[ User.field.email ];
				user[ User.field.lang ] = request.body.user[ User.field.lang ];
				user[ User.field.rank ] = User.rank.sys;
				user[ User.field.role ] = [
					User.role.user,
					User.role.batch,
					User.role.upload,
					User.role.meta,
					User.role.sync,
					User.role.suggest,
					User.role.dict,
					User.role.commit,
					User.role.query,
					User.role.download
				];

				//
				// Create authorisation data.
				//
				user.auth = auth.create( request.body[ User.param.user ][ User.param.pass ] );

				//
				// Save user.
				//
				try
				{
					const meta = users.insert( user );
					Object.assign( user, meta );
				}
				catch( error )
				{
					response.throw( 500, error );								// !@! ==>
				}

				//
				// Handle session.
				//
				request.session.uid = user._key;
				request.session.data = {};
				request.session.data.history = [{
					event : Event.login,
					stamp : Date.now()
				}];

				//
				// Save session.
				//
				request.sessionStorage.save( request.session );

				//
				// Handle user.
				//
				request.user = {};
				for( const prop of [
					User.field.name,
					User.field.email,
					User.field.lang,
					User.field.rank,
					User.field.role ] )
					request.user[ prop ] = user[ prop ];

				//
				// Update status.
				//
				Status.set( false, true );

				response.send({ success: true });									// ==>
			}
			else {
				response.throw( 404, "Missing authentication data." );			// !@! ==>
			}
		} else {
			response.throw( 403, "The users collection must be empty." );		// !@! ==>
		}
	}
)
.body(
	SchemaAdmin,
	'Credentials'
)
.response(
	[ 'application/json' ],
	"Operation status."
)
.summary(
	"Signup administrator"
)
.description(
	`Creates the system administrator user.`
);


/**
 * Current user info
 *
 * The service will return the currently logged on user information.
 *
 * The service will attempt to locate the user bearing the userid and will
 * return the user's following fields:
 *
 * 	- username: The user code.
 * 	- name:		The user name.
 * 	- email:	The user e-mail address.
 * 	- language:	The user's preferred language.
 * 	- rank:		The user rank.
 * 	- role:		The user roles.
 * 	- status:	The user status (optional).
 *
 * @path		/whoami
 * @verb		post
 * @request		{Object}	Authentication parameters and administrator user.
 * @response	{Object}	The success parameter set to true.
 */
router.get(
	'/whoami',
	(request, response) =>
	{
		//
		// Check current user.
		//
		if( request.session.uid )
		{
			let user = null;
			const info = {};
			try
			{
				user = users.document( request.session.uid );
			}
			catch( error )
			{
				response.throw( error );										// !@! ==>
			}

			if( user === null ) {
				response.throw(
					404,
					"Unable to locate current user." );							// !@! ==>
			}

			for( const prop of [
				User.field.name,
				User.field.email,
				User.field.lang,
				User.field.rank,
				User.field.role ] )
				info[ prop ] = user[ prop ];
			if( user.hasOwnProperty( User.field.status ) )
				info[ User.field.status ] = user[ User.field.status ];

			response.send( info );													// ==>
		}
		else {
			response.throw( 404, "No user is logged in." );							// ==>
		}
	}
)
.response(
	[ 'application/json' ],			// Content type.
	"The current user."				// Response description.
)
.summary(
	"Current user"
)
.description(dd`
  Returns the current user code, language, rank and roles.
`);


router.post(function (req, res) {
	const user = req.body;
	let meta;
	try {
		meta = users.save(user);
	} catch (e) {
		if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
			throw httpError(HTTP_CONFLICT, e.message);
		}
		throw e;
	}
	Object.assign(user, meta);
	res.status(201);
	res.set('location', req.makeAbsolute(
		req.reverse('detail', {key: user._key})
	));
	res.send(user);
}, 'create')
	.body(SchemaUser, 'The user to create.')
	.response(201, SchemaUser, 'The created user.')
	.error(HTTP_CONFLICT, 'The user already exists.')
	.summary('Create a new user')
	.description(dd`
  Creates a new user from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
	const key = req.pathParams.key;
	let user
	try {
		user = users.document(key);
	} catch (e) {
		if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, e.message);
		}
		throw e;
	}
	res.send(user);
}, 'detail')
	.pathParam('key', keySchema)
	.response(SchemaUser, 'The user.')
	.summary('Fetch a user')
	.description(dd`
  Retrieves a user by its key.
`);


router.put(':key', function (req, res) {
	const key = req.pathParams.key;
	const user = req.body;
	let meta;
	try {
		meta = users.replace(key, user);
	} catch (e) {
		if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, e.message);
		}
		if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
			throw httpError(HTTP_CONFLICT, e.message);
		}
		throw e;
	}
	Object.assign(user, meta);
	res.send(user);
}, 'replace')
	.pathParam('key', keySchema)
	.body(SchemaUser, 'The data to replace the user with.')
	.response(SchemaUser, 'The new user.')
	.summary('Replace a user')
	.description(dd`
  Replaces an existing user with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
	const key = req.pathParams.key;
	const patchData = req.body;
	let user;
	try {
		users.update(key, patchData);
		user = users.document(key);
	} catch (e) {
		if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, e.message);
		}
		if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
			throw httpError(HTTP_CONFLICT, e.message);
		}
		throw e;
	}
	res.send(user);
}, 'update')
	.pathParam('key', keySchema)
	.body(Joi.object().description('The data to update the user with.'))
	.response(SchemaUser, 'The updated user.')
	.summary('Update a user')
	.description(dd`
  Patches a user with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
	const key = req.pathParams.key;
	try {
		users.remove(key);
	} catch (e) {
		if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, e.message);
		}
		throw e;
	}
}, 'delete')
	.pathParam('key', keySchema)
	.response(null)
	.summary('Remove a user')
	.description(dd`
  Deletes a user from the database.
`);
