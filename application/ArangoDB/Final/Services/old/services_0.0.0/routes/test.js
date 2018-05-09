'use strict';

/**
 * Test services
 *
 * This path is used to test services.
 */

//
// Import frameworks.
//
const dd = require('dedent');							// For multiline text.
const fs = require('fs');								// File system utilities.
const db = require('@arangodb').db;						// Database object.
const Joi = require('joi');								// Validation framework.
const crypto = require('@arangodb/crypto');				// Cryptographic functions.
const httpError = require('http-errors');				// HTTP errors.
const status = require('statuses');						// Don't know what it is.
const errors = require('@arangodb').errors;				// ArangoDB errors.
const createAuth = require('@arangodb/foxx/auth');		// Authentication framework.
const createRouter = require('@arangodb/foxx/router');	// Router class.
const jwtStorage = require('@arangodb/foxx/sessions/storages/jwt');

//
// Instantiate objects.
//
const Status = require( '../utils/Status' );			// Status module.
const Middleware = require( '../utils/Middleware' );	// Middleware.

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
router.tag( 'test' );


/**
 * Test GET request contents
 *
 * The service will return the request contents.
 *
 * @path		/get-request
 * @verb		get
 * @response	{Object}	The request contents.
 */
router.get(
	'/get-request',						// Path.
	(request, response) => {			// Request handler.
		response.send( request );
	}
)
	.response(
		[ 'application/json' ],
		"Request contents."
	)
	.summary(
		"Get request contents"
	)
	.description(dd`
  Returns the request contents.
`);


/**
 * Test POST request contents
 *
 * The service will return the request contents.
 *
 * @path		/post-request
 * @verb		get
 * @response	{Object}	The request contents.
 */
router.post(
	'/post-request',					// Path.
	(request, response) => {			// Request handler.
		response.send( request );
	}
)
	.body(
		[ 'application/json' ],
		"Request contents."
	)
	.response(
		[ 'application/json' ],
		"Request contents."
	)
	.summary(
		"Get request contents"
	)
	.description(dd`
  Returns the request contents.
`);


/**
 * Test temporary files path
 *
 * The service will return the temporary files path.
 *
 * @path		/temp-dir
 * @verb		get
 * @response	{Object}	The path of the temporary directory.
 */
router.get(
	'/temp-dir',						// Path.
	(request, response) => {			// Request handler.

		//
		// Init local storage.
		//
		const path = fs.getTempPath();

		response.send({
			success: true,
			path: path
		});
	}
)
	.response(
		[ 'application/json' ],
		"Operation status and directory path."
	)
	.summary(
		"Get temp files directory path"
	)
	.description(dd`
  Returns the temporary files directory path.
`);


/**
 * Test base path
 *
 * The service will return the base path.
 *
 * @path		/temp-dir
 * @verb		get
 * @response	{Object}	The path of the temporary directory.
 */
router.get(
	'/base-dir',						// Path.
	(request, response) => {			// Request handler.

		//
		// Init local storage.
		//
		const path = module.context.basePath;

		response.send({
			success: true,
			path: path
		});
	}
)
	.response(
		[ 'application/json' ],
		"Operation status and base path."
	)
	.summary(
		"Get base path"
	)
	.description(dd`
  Returns the base path.
`);


/**
 * Test temporary file
 *
 * The service will create a temporary file and return its path.
 *
 * @path		/temp-file
 * @verb		get
 * @response	{Object}	The path of the temporary file.
 */
router.get(
	'/temp-file',						// Path.
	(request, response) => {			// Request handler.

		//
		// Init local storage.
		//
		const path = fs.getTempPath();
		const file = fs.getTempFile( path, true );

		response.send({
			success: true,
			path: file
		});
	}
)
	.response(
		[ 'application/json' ],
		"Operation status and file path."
	)
	.summary(
		"Get temp file path"
	)
	.description(dd`
  Create and return temporary file path.
`);


/**
 * Test status update
 *
 * The service will update the status.
 *
 * @path		/status-update
 * @verb		get
 * @response	{Object}	The path of the temporary file.
 */
router.get(
	'/status-update',					// Path.
	(request, response) => {			// Request handler.

		//
		// Update status.
		//
		try {
			response.send({ success: Status.set( false, true ) });
		} catch( error ) {
			response.throw( error );
		}
	}
)
	.response(
		[ 'application/json' ],
		"Operation status."
	)
	.summary(
		"Test status update"
	)
	.description(dd`
  Update status.
`);


/**
 * Test unzip file
 *
 * The service will unzip a file into thea temporary directory.
 *
 * @path		/unzip
 * @verb		get
 * @response	{Object}	The path of the temporary file.
 */
router.get(
	'/unzip',							// Path.
	(request, response) => {			// Request handler.

		//
		// Init local storage.
		//
		const base = module.context.basePath;
		const zipped = base + '/data/terms.json.zip';
		const path = base + '/data/temp/';

		//
		// Unzip file.
		//
		const result = fs.unzipFile( zipped, path );

		response.send({
			success: true,
			path: path + "terms.json"
		});
	}
)
	.response(
		[ 'application/json' ],
		"Operation status and file path."
	)
	.summary(
		"Unzip file"
	)
	.description(dd`
  Unzip a file into a temporary file.
`);


/**
 * Get encoding algorytms
 *
 * The service will return the list of encoding algorythms.
 *
 * @path		/algos
 * @verb		get
 * @response	{Object}	The list of algotythms.
 */
router.get(
	'/algos',							// Path.
	(request, response) => {			// Request handler.
		const algos = crypto.jwtAlgorithms;
		response.send({ algos: algos});
	}
)
	.response(
		[ 'application/json' ],
		"Cryptographic algorythms."
	)
	.summary(
		"Get crypto algorythms"
	)
	.description(dd`
  Return the list of JWT algorythms.
`);


/**
 * Get JWT secret
 *
 * The service will return the JWT secret.
 *
 * @path		/jwt
 * @verb		get
 * @response	{Object}	The JWT secret.
 */
router.get(
	'/jwt',							// Path.
	(request, response) => {			// Request handler.
		const secret = module.context.configuration.jwtSecret;
		response.send({ jwt: secret });
	}
)
	.response(
		[ 'application/json' ],
		"JWT secret."
	)
	.summary(
		"Get JWT secret"
	)
	.description(dd`
  Return the JWT secret.
`);


/**
 * Test encode
 *
 * The service will encode the provided message, it expects the following parameters:
 * 	- key:			The secret key.
 * 	- message:		The message to encrypt.
 * 	- algorythm:	The algorythm to use: HS256, HS384, HS512, none.
 *
 * @path		/encode
 * @verb		post
 * @response	{Object}	token: {String}.
 */
router.post(
	'/encode',							// Path.
	(request, response) => {			// Request handler.
		//
		// Check request.
		//
		const msg = request.body;
		if( ! msg.hasOwnProperty( 'key' ) )
			response.throw( 400, "missing key." );
		if( ! msg.hasOwnProperty( 'message' ) )
			response.throw( 400, "missing message." );
		if( ! msg.hasOwnProperty( 'algorythm' ) )
			response.throw( 400, "missing algorythm." );

		//
		// Generate token.
		//
		try {
			const token = crypto.jwtEncode( msg.key, msg.message, msg.algorythm );
			response.send({ token : token});
		} catch( error ) {
			response.throw( error );
		}
	}
)
	.body(
		[ 'application/json' ],
		"Request contents."
	)
	.response(
		[ 'application/json' ],
		"Encoded token."
	)
	.summary(
		"Encode message"
	)
	.description(dd`
  Encode a message and return a JWT token.
`);


/**
 * Test decode
 *
 * The service will decode the provided token, it expects the following parameters:
 * 	- key:			The token key.
 * 	- token:		The encoded token.
 *
 * @path		/decode
 * @verb		post
 * @response	{Object}	Decoded token.
 */
router.post(
	'/decode',							// Path.
	(request, response) => {			// Request handler.

		//
		// Check request.
		//
		const msg = request.body;
		if( ! msg.hasOwnProperty( 'key' ) )
			response.throw( 400, "missing key." );
		if( ! msg.hasOwnProperty( 'token' ) )
			response.throw( 400, "missing token." );

		//
		// Decode token.
		//
		try {
			const data = crypto.jwtDecode( msg.key, msg.token );
			response.send( data );
		} catch( error ) {
			response.throw( 400, error );
		}
	}
)
	.body(
		[ 'application/json' ],
		"Request contents."
	)
	.response(
		[ 'application/json' ],
		"Encoded token."
	)
	.summary(
		"Encode message"
	)
	.description(dd`
  Encode a message and return a JWT token.
`);


/**
 * Test middleware
 *
 * The service will test the middleware, it will use function pointers
 * instead of implementing the handler on-line.
 *
 * @path		/middleware
 * @verb		get
 * @response	{Object}	Decoded token.
 */
router.get(
	'/middleware',		// Path.
	Middleware.mid1,	// Middleware 1.
	Middleware.mid2,	// Middleware 2.
	Middleware.mid3,	// Middleware 3.
	Middleware.handler,	// Handler.
	'MiddlewareTest'
)
	.response(
		[ 'application/json' ],
		"Middleware results."
	)
	.summary(
		"Middleware test"
	)
	.description(dd`
  Use three middleware and one handler as function pointers.
`);


/**
 * Test static class functions
 *
 * The service will test static class functions.
 *
 * @path		/static
 * @verb		get
 * @response	{Object}	Decoded token.
 */
router.get(
	'/static',
	(request, response) => {
		const test = require( '../utils/Test' );
		response.send({
			name: test.test.name,
			index : test.test.index,
			count: test.test.collection.count()
		});
	},
	'StaticTest'
)
	.response(
		[ 'application/json' ],
		"Test results."
	)
	.summary(
		"Statis class tesst"
	)
	.description(dd`
  Test static class methods.
`);


/**
 * Test post with path parameter
 *
 * The service will test a post with path parameter.
 *
 * @path		/multiple
 * @verb		get
 * @response	{Object}	Decoded token.
 */
router.post(
	'/multiple/:key',
	(request, response) => {
		response.send({
			pathParam : request.pathParams.key,
			bodyParam : request.body
		});
	},
	'StaticTest'
)
	.body(
		[ 'application/json' ],
		Joi.object().required,
		"Request contents."
	)
	.pathParam(
		'key',
		Joi.string().required(),
		'Path parameter.'
	)
	.response(
		[ 'application/json' ],
		"Test results."
	)
	.summary(
		"Statis class tesst"
	)
	.description(dd`
  Test static class methods.
`);
