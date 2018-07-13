/**
 * LoadBaseSymbols.js
 *
 * This script will load the collections created with the "Symbols.numbers" CSV export
 * into the terms, descriptors and edges collections.
 */


/*=======================================================================================
 *										FUNCTIONS										*
 *======================================================================================*/

/**
 * ConvertArray
 *
 * This function will convert an object to an array, or return <code>null</code> if the
 * parameter is not an array.
 *
 * @param array|object		theArray	 	Array or object
 *
 * @return array|null		Array or <code>null</code>.
 */
function ConvertArray( theArray )
{
	//
	// Handle array.
	//
	if( theArray.constructor === Array )
		return theArray;												// ==>
		
	//
	// Convert object.
	//
	if( typeof( theArray ) === 'object' ) {
		var list = [];
		Object.keys( theArray ).forEach(function(element) {
			list.push( theArray[ element ] );
		});
		
		return list;													// ==>
	}
	
	return null;														// ==>

} // ConvertArray.

/**
 * CleanArray
 *
 * This function will convert to array and remove all empty elements from the provided
 * parameter.
 *
 * The function expects an array or an object and will return an array without the empty
 * elements, or <code>null</code> if the parameter is neither an array or an object.
 *
 * @param array|object		theArray	 	Array or object to clean.
 *
 * @return array|null		Cleaned array or <code>null</code>.
 */
function CleanArray( theArray )
{
	//
	// Convert object.
	//
	theArray = ConvertArray( theArray );
	if( theArray === null )
		return null;													// ==>
	
	//
	// Filter empty elements.
	//
	return
		theArray.filter(function(element) {
			if( element === null )
				return false;
			if( typeof( element ) === 'object' )
				return false;
			if( typeof( element ) === 'string' )
				return ( element.length > 0 );
			return true;
		});																// ==>

} // CleanArray.

/**
 * FixRangeArray
 *
 * This function will clean the provided range array.
 *
 * The function expects a range array: it will check if all elements are valid.
 *
 * The function will return the cleaned array, if valid, or <code>null</code> if invalid.
 *
 * @param object			theArray	 	Array to clean.
 *
 * @return array|null		Cleaned array, or <code>null</code>.
 */
function FixRangeArray( theArray )
{
	//
	// Convert object.
	//
	theArray = ConvertArray( theArray );
	if( theArray === null )
		return null;													// ==>
	
	//
	// Handle range.
	//
	var tmp;
	for( var i = 0; i < 2; i++ ) {
		tmp = parseFloat( theArray[ i ] );
		if( ! isNaN( theArray[ i ] ) ) {
			theArray[ i ] = tmp;
		} else {
			return null;												// ==>
		}
	}
	
	//
	// Handle bools.
	//
	for( var i = 2; i < 4; i++ ) {
		switch( theArray[ i ] )
		{
			case "TRUE":
			case "true":
			case "Y":
			case "y":
			case 1:
			case true:
				theArray[ i ] = true;
				break;
				
			case "FALSE":
			case "false":
			case "N":
			case "n":
			case 0:
			case false:
				theArray[ i ] = false;
				break;
			
			default:
				return null;											// ==>
		}
	}
	
	return theArray;													// ==>

} // FixRangeArray.

/**
 * CleanDocument
 *
 * This function will convert and clean all array fields in the provided document.
 *
 * @param object			theDocument	 	Document to clean.
 */
function CleanDocument( theDocument )
{
	//
	// Init local storage.
	//
	var arrays = [
		"syn", "pname", "names", "naming", "keyword", "units", "terms", "fields",
		"switch", "role", "instances", "category", "attributes", "info", "branches",
		"STD_languages", "STD_currencies", "STD_geo_DEG", "STD_geo_DMS", "STD_nam_type",
		"WB_topic", "GEOnet_CC1", "GEOnet_CC2"
	];
	
	//
	// Iterate fields.
	//
	var field;
	for( field in theDocument ) {
		if( arrays.includes( field )
		 && (theDocument[ field ] !== null) ) {
			theDocument[ field ] = CleanArray( theDocument[ field ] );
		}
	}
	
// 	return theDocument;													// ==>

} // CleanDocument.

/**
 * AddSchema
 *
 * This function will add the provided schema to the schemas collection.
 *
 * The function expects an imported schema document and a branch, or list of branches.
 * The function will first check if the document exists, if that is the case, it will
 * compare the existing and new document: if they are equal, it will simply add the branch
 * to the branches set; if they are not equal, it will add the differing properties to the
 * mofifiers structure and add the branch.
 *
 * The function expects three parameters: the new schema document, the branch, or array of
 * branches and the destination collection name.
 *
 * @param object			theDocument	 	New schema document.
 * @param string|array		theBranch		Branch or branches.
 * @param string			theCollection	Destination collection name.
 */
function AddSchema( theDocument, theBranch, theCollection )
{
	//
	// Clean document.
	//
	CleanDocument( theDocument );
	
	//
	// Convert branch to array.
	//
	if(typeof( theBranch ) == 'object' ) {
		theBranch = ConvertArray( theBranch );
	}
		
	//
	// Handle list of branches.
	//
	if( theBranch.constructor === Array ) {
		theBranch.forEach(function(branch) {
			AddSchema( theDocument, branch, theCollection );
		});
	}
	
	//
	// Handle single branch.
	//
	else {
		//
		// Remove branch.
		//
		if( theDocument.hasOwnProperty( "branches" ) ) {
			delete theDocument.branches;
		}
	
		//
		// Set identifiers.
		//
		var hash_vals = [];
		hash_vals.push( theDocument._from );
		hash_vals.push( theDocument._to );
		hash_vals.push( theDocument.predicate );
		theDocument._key = hex_md5( hash_vals.join( "\t" ) );
		theDocument._id = theCollection + "/" + theDocument._key;
	
		//
		// Check if it exists.
		//
		var filter = { "_id" : theDocument._id };
		var existing = db[ theCollection ].findOne( filter );
	
		//
		// Handle existing document.
		//
		if( existing !== null ) {
			var modifiers = {};
			var fields = [
				"rank", "init", "enable", "access", "usage", "interface", "level", "order",
				"terms", "fields", "label", "definition", "descripton", "note", "example",
				"domain", "instance", "category", "keyword", "info", "schema"
			];
		
			//
			// Find differences.
			//
			fields.forEach(function(field) {
			
				//
				// Handle both fields.
				//
				if( theDocument.hasOwnProperty( field )
				 && existing.hasOwnProperty( field ) ) {
				 	
					//
					// Handle arrays.
					//
					if( theDocument[ field ].constructor === Array ) {
						if( theDocument[ field ].length == existing[ field ].length ) {
							var newdoc = theDocument[ field ];
							var olddoc = existing[ field ];
							newdoc.sort();
							olddoc.sort();
							if( newdoc.toString() != olddoc.toString() ) {
								modifiers[ field ] = theDocument[ field ];
							}
						}
					}
				
					//
					// Handle scalars.
					//
					else if( theDocument[ field ] != existing[ field ] ) {
						modifiers[ field ] = theDocument[ field ];
					}
				}
			
				//
				// Handle provided new field.
				//
				else if( theDocument.hasOwnProperty( field ) ) {
					modifiers[ field ] = theDocument[ field ];
				}
			
				//
				// Handle provided missing field.
				//
				else if( existing.hasOwnProperty( field ) ){
					modifiers[ field ] = null;
				}
			});
		
			//
			// Init local storage.
			//
			var modifs = { "$addToSet" : { "branches" : theBranch } };
		
			//
			// Handle modifiers.
			//
			if( Object.keys( modifiers ).length > 0 ) {
				modifs[ "$set" ] = { "modifiers" : {} };
				modifs[ "$set" ][ "modifiers" ][ theBranch ] = modifiers;
			}
		
			//
			// Update document.
			//
			db[ theCollection ].updateOne( filter, modifs, { "$upsert" : false } );
		}
	
		//
		// Handle new document.
		//
		else {
			theDocument[ "branches" ] = [ theBranch ];
			db[ theCollection ].insert( theDocument );
		}
	}
	
} // AddSchema.


/*=======================================================================================
 *										GLOBALS											*
 *======================================================================================*/

var bulk_count, bulk_docs;
var collections = [
	"tmp_terms", "tmp_descriptors", "tmp_enums",
	"tmp_form_users", "tmp_form_terms", "tmp_form_descriptors",
	"tmp_class_terms", "tmp_class_descriptors", "tmp_class_edges"
];
var documents = {
	"tmp_terms" : "terms",
	"tmp_descriptors" : "descriptors"
};
var schemas = {
	"tmp_enums" : "schemas"
};
var edges = {
	"tmp_form_users" : "schemas",
	"tmp_form_terms" : "schemas",
	"tmp_form_descriptors" : "schemas",
	"tmp_class_terms" : "schemas",
	"tmp_class_descriptors" : "schemas",
	"tmp_class_edges" : "schemas"
};


/*=======================================================================================
 *	Clean import collections.															*
 *======================================================================================*/

//
// Select descriptors with enumeration selections and remove empty entries.
//
collections.forEach(function(collection) {

	//
	// Init bulk operations.
	//
	bulk_count = 0;
	bulk_docs = db[ collection ].initializeUnorderedBulkOp();
	
	//
	// Select all records.
	//
	db[ collection ]
		.find({})
		.forEach(function(doc) {
			
			//
			// Init local storage.
			//
			var res = null;
			
			//
			// Clean document.
			//
			CleanDocument(doc);
		
			//
			// Handle range arrays.
			//
			[
				'size', 'length', 'range'
			].forEach(function(prop) {
				if( doc.hasOwnProperty( prop ) ) {
					res = FixRangeArray( doc[ prop ] );
					if( (res !== null)
					 && (res.length === 4) ) {
						doc[ prop ] = res;
					} else {
						delete doc[ prop ];
					}
				}
			});
			
			//
			// Update document.
			//
			bulk_docs
				.find({ '_id' : doc._id })
					.replaceOne( doc );
			if( ++bulk_count === 1000 ) {
				bulk_docs.execute();
				bulk_docs = db[ collection ].initializeUnorderedBulkOp();
			}
	});
	
	//
	// Flush.
	//
	bulk_docs.execute();
});


/*=======================================================================================
 *	Import terms and descriptors.														*
 *======================================================================================*/

//
// Iterate term and descriptor collections.
//
for( var collection in documents ) {
	//
	// Init local storage.
	//
	var read = collection;
	var write = documents[ collection ];
	
	//
	// Init bulk operations.
	//
	bulk_count = 0;
	bulk_docs = db[ write ].initializeOrderedBulkOp();
	
	//
	// Iterate documents.
	//
	db[ read ].find({}).forEach(function( doc ) {
		CleanDocument(doc);
		bulk_docs.insert( doc );
		if( ++bulk_count === 1000 ) {
			bulk_docs.execute();
			bulk_docs = db[ write ].initializeOrderedBulkOp();
		}
	});
	
	//
	// Flush.
	//
	bulk_docs.execute();
}

//
// Add namespace instances.
//
for( var collection in documents ) {
	//
	// Init local storage.
	//
	var read = documents[ collection ];
	
	//
	// Init bulk operations.
	//
	bulk_count = 0;
	bulk_docs = db.terms.initializeUnorderedBulkOp();
	
	//
	// Iterate documents.
	//
	db[ read ].find({}).forEach(function( doc ) {
		if( doc.hasOwnProperty( "nid" ) ) {
			bulk_docs
				.find({ "_id" : doc.nid })
					.updateOne({ "$addToSet" : { "instances" : ":instance:namespace" } });
			if( ++bulk_count === 1000 ) {
				bulk_docs.execute();
				bulk_docs = db.terms.initializeUnorderedBulkOp();
			}
		}
	});
	
	//
	// Flush.
	//
	bulk_docs.execute();
}

/*=======================================================================================
 *	Add descriptor instances.															*
 *======================================================================================*/

/**
 * MILKO - Removed this section because the instance field in terms is used by
 *		   data types to identify the instance to which the value must belong.
 */
/*
//
// Init bulk operations.
//
bulk_count = 0;
bulk_docs = db.descriptors.initializeUnorderedBulkOp();

//
// Iterate descriptors.
//
db.descriptors.find({}).forEach(function(doc) {
	var term = db.terms.findOne({ "_key" : doc.type });
	bulk_docs
		.find({ "_id" : doc._id })
			.updateOne({ "$addToSet" : { "instances" : term.instance } });
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.descriptors.initializeUnorderedBulkOp();
	}
});

//
// Flush.
//
bulk_docs.execute();
*/

/*=======================================================================================
 *	Import schemas.																		*
 *======================================================================================*/

//
// Iterate edges import collection.
//
for( var collection in schemas ) {
	//
	// Init local storage.
	//
	var read = collection;
	var write = schemas[ collection ];
	
	//
	// Init bulk operations.
	//
	bulk_count = 0;
	bulk_docs = db.terms.initializeUnorderedBulkOp();
	
	//
	// Iterate documents.
	//
	db[ read ].find({}).forEach(function( doc ) {
	
		//
		// Add schema document.
		//
		var branch = doc.branch;
		delete doc.branch;
		AddSchema( doc, branch, write );
		
		//
		// Add enums.
		//
		if( (doc.predicate === "terms/:predicate:enum-of")
		 || (doc.predicate === "terms/:predicate:category-of") )
		{
			//
			// Add enumeration instance.
			//
			bulk_docs
				.find({ "_id" : branch })
					.updateOne({ "$addToSet" : { "instances" : ":instance:enumeration" } });
			if( ++bulk_count === 1000 ) {
				bulk_docs.execute();
				bulk_docs = db.terms.initializeUnorderedBulkOp();
			}
		
			//
			// Add predicate instance.
			//
			bulk_docs
				.find({ "_id" : doc.predicate })
					.updateOne({ "$addToSet" : { "instances" : ":instance:predicate" } });
			if( ++bulk_count === 1000 ) {
				bulk_docs.execute();
				bulk_docs = db.terms.initializeUnorderedBulkOp();
			}
		
			//
			// Add category or seletion instances.
			//
			var updt;
		
			if( doc.predicate == "terms/:predicate:category-of" )
				updt = { "$addToSet" : { "instances" : ":instance:category" } };
			else if( doc.predicate == "terms/:predicate:enum-of" )
				updt = { "$addToSet" : { "instances" : ":instance:selection" } };
		
			bulk_docs
				.find({ "_id" : doc._from })
					.updateOne( updt );
			if( ++bulk_count === 1000 ) {
				bulk_docs.execute();
				bulk_docs = db.terms.initializeUnorderedBulkOp();
			}
		}
	});
	
	//
	// Flush.
	//
	bulk_docs.execute();
}


/*=======================================================================================
 *	Import forms and classes.															*
 *======================================================================================*/

//
// Iterate edges import collection.
//
for( var collection in edges ) {

	//
	// Init local storage.
	//
	var read = collection;
	var write = edges[ collection ];
	
	//
	// Init bulk operations.
	//
	bulk_count = 0;
	bulk_docs = db.terms.initializeUnorderedBulkOp();
	
	//
	// Iterate documents.
	//
	db[ read ].find({}).forEach(function( doc ) {

		//
		// Convert array fields.
		//
		[ "keyword", "terms", "fields", "branches" ].forEach(function(prop) {
			if( doc.hasOwnProperty( prop ) )
				doc[ prop ] = ConvertArray( doc[ prop ] );
		});
		
		//
		// Add schema document.
		//
		var branch;
		if( doc.hasOwnProperty( "branch" ) ) {
			branch = doc.branch;
			delete doc.branch;
		} else {
			branch = doc.branches;
			delete doc.branches;
		}
		AddSchema( doc, branch, write );
		
		//
		// Init local storage.
		//
		var branches;
		if( branch.constructor !== Array )
			branches = [ branch ];
		else
			branches = branch;
		var instance = null;
		if( doc.predicate == "terms/:predicate:form-of" )
			instance = ":instance:form";
		else if( doc.predicate == "terms/:predicate:class-of" )
			instance = ":instance:class";
		
		//
		// Add form or class instance.
		//
		if( instance !== null ) {
			branches.forEach(function(bra) {
				bulk_docs
					.find({ "_id" : bra })
						.updateOne({ "$addToSet" : { "instances" : instance } });
				if( ++bulk_count === 1000 ) {
					bulk_docs.execute();
					bulk_docs = db.terms.initializeUnorderedBulkOp();
				}
			});
		}
		
		//
		// Add predicate instance.
		//
		bulk_docs
			.find({ "_id" : doc.predicate })
				.updateOne({ "$addToSet" : { "instances" : ":instance:predicate" } });
		if( ++bulk_count === 1000 ) {
			bulk_docs.execute();
			bulk_docs = db.terms.initializeUnorderedBulkOp();
		}
	});
	
	//
	// Flush.
	//
	bulk_docs.execute();
}


print("*=======================================================================================*");
print("* LoadBaseSymbols ==> DONE!");
print("*=======================================================================================*");
