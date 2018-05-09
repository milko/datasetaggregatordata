'use strict';

//
// Create router.
//
const createRouter = require( '@arangodb/foxx/router' );
const router = createRouter();

//
// Mount router.
//
module.context.use( router );

//
// Hello World route.
//
router.get(
	'/hello-world',						// Path.
	(req, res) => {						// Request handler.
		res.send( "Hello World!" );		// Send string.
	}
)
	.response(
		[ 'text/plain' ],				// Content type.
		"A generic greeting"			// Response description.
	)
	.summary(
		"Generic greetinr"
	)
	.description(
		"Prints a generic greeting."
	);

//
// Personalised greeting route.
//
const joi = require( 'joi' );				// Include Joi framework.
router.get(
	'/hello/:name',							// Path.
	(req, res) => {
		res.send(
			`Hello ${req.pathParams.name}`	// Take "name" parameter.
		);
	}
)
	// If the parameter does not validate, the request URL will be skipped.
	.pathParam(
		'name',								// Parameter name.
		joi.string().required(),			// Validation (required string).
		"Name to greet."					// Parameter description.
	)
	.response(
		[ 'text/plain' ],					// Content type.
		"A personalised greeting"			// Response description.
	)
	.summary(
		"Personalised greetinr"
	)
	.description(
		"Prints a personalised greeting."
	);

//
// JSON parameter route.
//
router.post(
	'/sum',											// Path.
	(req, res) => {
		const values = req.body.values;				
		res.send({
			result:									// Response JSON field.
				values.reduce(						// Sum the elements of the array.
					(a, b) => { return a + b; },
					0
				)
		});
	}
)
	.body(											// Body schema.
		joi.object({
  			values:									// Body parameter,
  				joi.array()							// must be an array,
  				.items(								// with items as
  					joi.number()					// numbers
  					.required()						// that are required,
  				).required()						// and the array is required,
		}).required(),								// as well as the JSON object.
		'Values to add together.'					// Description of parameter.
	)
	.response(
		[ 'application/json' ],						// Content type (may be omitted).
		joi.object({								// Response schema.
  			result:									// Response parameter,
  				joi.number()						// must be a number
  				.required()							// and is required,
		}).required(),								// as well as the response.
		'Sum of the input values.'					// Description.
	)
	.summary(
		'Add up numbers'
	)
	.description(
		'Calculates the sum of an array of number values.'
	);

//
// Store entries in the "myFoxxCollection" collection.
//
const db = require('@arangodb').db;
const errors = require('@arangodb').errors;
const foxxColl = db._collection('myFoxxCollection');
const DOC_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;

const docSchema =									// Document schema.
		joi.object().required().keys({				// Required object with properties:
			name: joi.string().required(),			// name (required string),
			age: joi.number().required()			// age (required number).
		})
		.unknown();

router.post(
	'/entries',										// Path.
	(req, res) => {
		const multiple = Array.isArray(req.body);	// Set flag if array.
		const body = (multiple)						// Set body to:
				   ? req.body						// body if array,
				   : [req.body];					// or make an array.

		let data = [];								// Init results.
		for (var doc of body) {						// Iterate body documents.
			const meta = foxxColl.save(doc);		// Save document.
			data.push(Object.assign(doc, meta));	// Save result.
		}
		res.send( (multiple) ? data					// Return result,
							 : data[0]);			// or first element if document req.
})
	.body(
		joi.alternatives().try(						// Validate using following:
			docSchema,								// single document,
			joi.array().items(docSchema)			// list of documents.
		),
		'Entry or entries to store in the collection.'
	)
	.response(
		[ 'application/json' ],						// Content type (may be omitted).
		joi.alternatives().try(						// Validate using following:
			joi.object().required(),				// required object,
			joi.array().items(						// or each item
				joi.object().required()				// must be required object.
			)
		),
		'Entry or entries stored in the collection.'
	)
	.summary(
		'Store entry or entries'
	)
	.description(
		'Store a single entry or multiple entries in the "myFoxxCollection" collection.'
	);

//
// Retrieve entry by key from the "myFoxxCollection" collection.
//
router.get(
	'/entries/:key',								// Path.
	(req, res) => {
		try {
			const data								// Get document by "key".
				= foxxColl.document(req.pathParams.key);
			res.send(data)							// Return found document.
		} catch (e) {
			if ( (! e.isArangoError)				// If not an ArangoDB error,
			  || (e.errorNum !== DOC_NOT_FOUND) ) {	// and not record not found:
				throw e;							// throw exception.
			}
			res.throw(								// Return error
				404,								// not found,
				'The entry does not exist',			// message,
				e									// error code
			);
		}
	}
)
	.pathParam(										// Path parameter schema:
		'key',										// parameter name,
		joi.string().required(),					// required string,
		'Key of the entry.'							// description.
	)
	.response(
		[ 'application/json' ],						// Content type (may be omitted).
		joi.object().required(),
		'Entry stored in the collection.'
	)
	.summary(
		'Retrieve an entry'
	)
	.description(
		'Retrieves an entry from the "myFoxxCollection" collection by key.'
	);

//
// Write AQL query.
//
const aql = require('@arangodb').aql;

router.get(
	'/entries',										// Path
	(req, res) => {
		const keys = db._query(aql`					// Make query
			FOR entry IN ${foxxColl}
				RETURN entry._key					// returning key.
		`);
		res.send(keys);								// Return keys.
	}
)
	.response(
		[ 'application/json' ],						// Content type (may be omitted).
		joi.array().items(							// Each item
			joi.string().required()					// is a required string,
		).required(),								// including the response.
		'List of entry keys.'						// Description.
	)
	.summary(
		'List entry keys'
	)
	.description(
		'Assembles a list of keys of entries in the collection.'
	);

//
// TEST.
//
router.get(
	'/test',
	(req, res) => {
		const collections = db._collections();
		console.log(collections);
		
		res.send( collections );
	}
)
	.response(
		[ 'application/json' ],
		"A test"
	)
	.summary(
		"Generic test"
	)
	.description(
		"tests."
	);
