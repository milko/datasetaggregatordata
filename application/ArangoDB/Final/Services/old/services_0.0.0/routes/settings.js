'use strict';

/**
 * Settings and initialisation services
 *
 * This set of services deal with settings and initialisation procedures.
 */

//
// Import frameworks.
//
const dd = require('dedent');							// For multiline text.
const fs = require('fs');								// File system utilities.
const db = require('@arangodb').db;						// Database framework.
const Joi = require('joi');								// Validation framework.
const httpError = require('http-errors');				// HTTP errors.
const status = require('statuses');						// Don't know what it is.
const errors = require('@arangodb').errors;				// ArangoDB errors.
const createRouter = require('@arangodb/foxx/router');	// Router class.
const Setting = require('../models/setting');			// Settings schema.

//
// Import application environment.
//
const Status = require( '../utils/Status' );			// Status management.

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
const router = createRouter();
module.exports = router;

//
// Set router tags.
//
router.tag('setting', 'init');


/**
 * Initialise application
 *
 * The service will:
 *
 * 	- Create all required collections.
 * 	- Create/update the settings status.
 * 	- Return the current status.
 *
 * @path		/init
 * @verb		get
 * @response	{Object}	The current status.
 */
router.get(
	'/init',					    	// Path.
	(request, response) => {			// Request handler.

		try {
			const status = Status.set( true, true );
			response.send( status.new );											// ==>
		}
		catch( error ) {
			response.throw( error );											// !@! ==>
		}
	}
)
.response(
	[ 'application/json' ],			// Content type.
	"The current status"			// Response description.
)
.summary(
	"Set or update current status"
)
.description(dd`
  Sets the current status and returns it.
`);


/**
 * Get current status
 *
 * The service will return the current status: it will be retrieved
 * from the current request (it is set in main.js).
 *
 * @path		/status
 * @verb		get
 * @response	{Object}	The current status.
 */
router.get(
	'/status',					    	// Path.
	(request, response) => {			// Request handler.

		if( request.applicationData.status.error !== 0 ) {
			response.throw(
				request.applicationData.status.error,
				request.applicationData.status.message
			);																	// !@! ==>
		}

		response.send( request.applicationData.status );							// ==>
	}
)
	.response(
		[ 'application/json' ],			// Content type.
		"The current status"			// Response description.
	)
	.summary(
		"Current status"
	)
	.description(dd`
  Returns the current settings status.
`);
