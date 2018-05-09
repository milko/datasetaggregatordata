'use strict';

//
// Libraries.
//
const joi = require('joi');                             // Validation routines.

//
// Routers.
//
const createRouter = require('@arangodb/foxx/router');  // Import router creation function.
const router = createRouter();                          // Instantiate router.
module.context.use(router);                             // Mount router.

//
// Hello World greeting.
//
router.get('hello-world', function(request, response) {
	response.send("Hello World!");
})
	.response( [ 'text/plain' ], "A generic greeting." )
	.summary( "Generic greeting" )
	.description( "Prints a generic greeting." );

//
// Personalised greeting.
//
router.get( 'hello/:name', function(request, response) {
	response.send( `Hello ${request.pathParams.name}` );
})
	.pathParam( 'name', joi.string().required(), "Name to greet." )
	.response( [ 'text/plain' ], "A personalised greeting." )
	.summary( "Personalised greeting" )
	.description( "Prints a personalised greeting." );

//
// Add numbers.
//
router.post('/sum', function (request, response) {
	const values = request.body.values;
	response.send({
		              result: values.reduce(function (a, b) { return a + b; }, 0)
	              });
})
      .body( joi.object({
	                        values : joi.array().items( joi.number().required()).required()
                        }).required(), "Values to add together." )
      .response( [ 'application/json' ], joi.object({
	                                                    result : joi.number().required()
                                                    }).required(), "Sum of the input numbers." )
      .summary( "Add numbers" )
      .description( "Calculates the sum of an array of number values." );

//
// Add numbers with text response.
//
router.post('/sum_text', function (request, response) {
	const values = request.body.values;
	const result = values.reduce( function( a, b ) { return a + b; }, 0 );
	response.send( result.toString() );
})
      .body( joi.object({
	    values : joi.array().items( joi.number().required()).required()
       }).required(), "Values to add together." )
      .response( [ 'text/plain' ], "Sum of the input numbers." )
      .summary( "Add numbers" )
      .description( "Calculates the sum of an array of number values and returns string result." );

//
// Handle database.
//
const db = require('@arangodb').db;
const errors = require('@arangodb').errors;
const foxxColl = db._collection('myFoxxCollection');
const DOC_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;

//
// Handle schema.
//
const docSchema = joi.object().required().keys({
   name: joi.string().required(),
   age: joi.number().required()
}).unknown();   // allow additional attributes

//
// Add a single object or a list of objects.
//
router.post( '/entries', function( req, res ) {
	const multiple = Array.isArray( req.body );
	const body = multiple ? req.body : [ req.body ];

	let data = [];
	for( let doc of body ) {
		const meta = foxxColl.save( doc );
		data.push( Object.assign( doc, meta ) );
	}
	res.send( multiple ? data : data[ 0 ] );    // Return object or array, depending on parameter.

})
      .body(joi.alternatives().try(
	      docSchema,
	      joi.array().items(docSchema)
      ), 'Entry or entries to store in the collection.')
      .response(joi.alternatives().try(
	      joi.object().required(),
	      joi.array().items(joi.object().required())
      ), 'Entry or entries stored in the collection.')
      .summary('Store entry or entries')
      .description('Store a single entry or multiple entries in the "myFoxxCollection" collection.');

//
// Get entry by key.
//
router.get('/entries/:key', function (req, res) {
	try {
		const data = foxxColl.document( req.pathParams.key );
		res.send( data )
	} catch (e) {
		if ( (! e.isArangoError) || (e.errorNum !== DOC_NOT_FOUND) ) {
			throw e;
		}
		res.throw(404, 'The entry does not exist', e);
	}
})
      .pathParam( 'key', joi.string().required(), 'Key of the entry.' )
      .response( joi.object().required(), 'Entry stored in the collection.' )
      .summary( 'Retrieve an entry' )
      .description( 'Retrieves an entry from the "myFoxxCollection" collection by key.' );

//
// Handle queries.
//
const aql = require('@arangodb').aql;

//
// Return entry keys.
//
router.get( '/entries', function( req, res ) {
	const keys = db._query( aql`
	    FOR entry IN ${foxxColl}
	        RETURN entry._key
  `);
// Alternate query:
// const keys = db._query(
// 	'FOR entry IN @@coll RETURN entry._key',
// 	{'@coll': foxxColl}
// );
	res.send(keys);
})
      .response( joi.array().items(
	      joi.string().required()
      ).required(), 'List of entry keys.')
      .summary( 'List entry keys' )
      .description( 'Assembles a list of keys of entries in the collection.' );
