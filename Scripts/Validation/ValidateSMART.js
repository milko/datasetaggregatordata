/**
 * ValidateSMART.js
 *
 * This script will validate the current smart database, it will scan all collections and
 * write eventual errors to a "tmp_errors" vollection.
 */


/*=======================================================================================
 *										FUNCTIONS										*
 *======================================================================================*/

/**
 * ValidateDocument
 *
 * This function will check all references in the provided term document.
 *
 * @param {Object}			theDocument	 	Document to check.
 * @param {String}			theCollection 	Document collection.
 */
function ValidateDocument( theDocument, theCollection )
{
	//
	// Iterate properties.
	//
	for( var property in theDocument ) {
		ValidateField(
			theCollection, theDocument._id, property, theDocument[ property ]
		);
	}
	
} // ValidateDocument.

/**
 * ValidateField
 *
 * This function will check the provided field.
 *
 * @param {String}			theCollection 	Document collection.
 * @param {String}			theIdentifier 	Document ID.
 * @param {String}			theProperty	 	Property name.
 * @param {value}			theValue	 	Property value.
 * @returns {Boolean}		false is error, true is OK, null is no not checked.
 */
function ValidateField( theCollection, theIdentifier, theProperty, theValue )
{
	//
	// Handle arrays.
	//
	if( theValue.constructor === Array ) {
		theValue.forEach(function(value) {
			ValidateField( theCollection, theIdentifier, theProperty, value );
		});
	} else {
		//
		// Parse type.
		//
		switch( descriptors[ theProperty ] ) {
			case ":type:data:ref":
				var tmp = theValue.split( '/' );
				if( tmp.length == 2 ) {
					if( db[ tmp[ 0 ] ].findOne({ "_id" : theValue }) === null ) {
						WriteError(
							theCollection,
							theIdentifier,
							theProperty,
							theValue,
							"Invalid object reference" );
						return false;									// ==>
					}
					return true;										// ==>
				}
				WriteError(
					theCollection,
					theIdentifier,
					theProperty,
					theValue,
					"Invalid object reference format" );
				return false;											// ==>
			
			case ":type:data:term":
			case ":type:data:term:enum":
				if( db.smart_terms.findOne({ "_key" : theValue }) === null ) {
					WriteError(
						theCollection,
						theIdentifier,
						theProperty,
						theValue,
						"Invalid term reference" );
					return false;										// ==>
				}
				return true;											// ==>
			
			case ":type:data:field":
			case ":type:data:field:enum":
				if( db.smart_descriptors.findOne({ "gid" : theValue }) === null ) {
					WriteError(
						theCollection,
						theIdentifier,
						theProperty,
						theValue,
						"Invalid field reference" );
					return false;										// ==>
				}
				return true;											// ==>
			
			case ":type:data:map":
			case ":type:data:map:str":
			case ":type:data:map:str:set":
			case ":type:data:map:txt":
			case ":type:data:map:html":
			case ":type:data:map:struct":
				for( var map in theValue ) {
					if( db.smart_terms.findOne({ "_key" : map }) === null ) {
						WriteError(
							theCollection,
							theIdentifier,
							theProperty,
							map,
							"Invalid map reference" );
						return false;									// ==>
					}
				}
				return true;											// ==>
		}
	
		return null;													// ==>
	}
	
} // ValidateField.

/**
 * WriteError
 *
 * This function will write an error entry in the "tmp_errors" collection.
 *
 * @param {String}			theCollecion	Collection name.
 * @param {String}			theIdentifier	Record identifier.
 * @param {String}			theProperty		Property name.
 * @param {String}			theValue		Property value.
 * @param {String}			theError		Error message.
 */
function WriteError(
	theCollecion,
	theIdentifier,
	theProperty,
	theValue,
	theError )
{
	//
	// Set error document.
	//
	var doc = {
		"collection"	: theCollecion,
		"identifier"	: theIdentifier,
		"property"		: theProperty,
		"value"			: theValue,
		"error"			: theError
	};
	
	//
	// Write error.
	//
	bulk_docs
		.insert( doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.tmp_errors.initializeOrderedBulkOp();
	}
	
} // WriteError.


/*=======================================================================================
 *										GLOBALS											*
 *======================================================================================*/

var errors = 0;
var descriptors = {};
var col_base = [
	"descriptors", "schemas", "terms"
];
var col_topo = [
	"descriptors", "edges", "schemas",
	"shapes", "terms", "toponyms"
];
db.smart_descriptors.find({}).forEach(function(doc) {
	descriptors[ doc._key ] = {};
	descriptors[ doc._key ][ "type" ] = doc.type;
	descriptors[ doc._key ][ "format" ] = ( doc.hasOwnProperty( "format" ) )
										? doc.format
										: "scalar";
});
db.tmp_errors.drop();


/*=======================================================================================
 *	Validate.																			*
 *======================================================================================*/

//
// Iterate all collections.
//
var bulk_count = 0;
var bulk_docs = db.tmp_errors.initializeOrderedBulkOp();
col_base
// col_topo
	.forEach(function(collection) {
		db[ collection ]
			.find({})
				.forEach(function(doc) {
					ValidateDocument( doc, collection );
		});
	});

//
// Flush.
//
bulk_docs.execute();

print("*=======================================================================================*");
print("* ValidateSMART ==> DONE!");
print("*=======================================================================================*");
