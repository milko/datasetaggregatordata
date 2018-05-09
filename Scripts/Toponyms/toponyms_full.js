/**
 * toponyms_full.js
 *
 * This script will load the full set of toponyms into the smart database.
 */


/*=======================================================================================
 *										FUNCTIONS										*
 *======================================================================================*/

/**
 * CreateToponym
 *
 * This function will create a new toponym from an old version.
 *
 * @param object			theOld		 	Old toponym.
 *
 * @return object			The new toponym.
 */
function CreateToponym( theOld )
{
	//
	// Init local storage.
	//
	var doc = {};
	
	//
	// Iterate toponym properties.
	//
	for( var property in theOld ) {
		switch( property )
		{
			case "_id":
				doc._id = theOld._id.replace( /^smart_toponyms\//, "toponyms/" );
				break;
				
			case "nid":
				doc.nid = theOld.nid.replace( /^smart_terms\//, "terms/" );
				break;
				
			case "synonym":
				doc.syn = theOld.synonym;
				break;
				
			case "phoneme":
				doc.pname = theOld.phoneme;
				break;
			
			default:
				doc[ property ] = theOld[ property ];
				break;
		}
	}
	
	//
	// Add names.
	//
	if(! doc.hasOwnProperty( "names" ) ) {
		doc.names = [];
		for( var lang in doc.label ) {
			if( ! doc.names.includes( doc.label[ lang ] ) ) {
				doc.names.push( doc.label[ lang ] );
			}
		}
	}
	
	return doc;															// ==>
	
} // CreateToponym.

/**
 * CreateShape
 *
 * This function will create a new shape from an old version.
 *
 * @param object			theOld		 	Old shape.
 *
 * @return object			The new shape.
 */
function CreateShape( theOld )
{
	//
	// Init local storage.
	//
	var doc = {};
	
	//
	// Create shape key.
	//
	var key = hex_md5( JSON.stringify( theOld.shape) );
	
	//
	// Iterate toponym properties.
	//
	for( var property in theOld ) {
		switch( property )
		{
			case "_id":
				doc._id = "shapes/" + key;
				break;
			
			case "_key":
				doc._key = key;
				break;
			
			default:
				doc[ property ] = theOld[ property ];
				break;
		}
	}
	
	return doc;															// ==>
	
} // CreateShape.

/**
 * CreateSchema
 *
 * This function will create a new schema from an old version.
 *
 * @param string			theFrom		 	Relationship source.
 * @param string			theDest		 	Relationship destination.
 * @param string			thePred		 	Relationship predicate.
 *
 * @return object			The new schema.
 */
function CreateSchema( theFrom, theDest, thePred )
{
	//
	// Init local storage.
	//
	var doc = {};
	
	//
	// Fix collection names.
	//
	theFrom = theFrom.replace( /^smart_terms\//, "terms/" );
	theDest = theDest.replace( /^smart_shapes\//, "shapes/" );
	theDest = theDest.replace( /^smart_toponyms\//, "toponyms/" );
	thePred = thePred.replace( /^smart_terms\//, "terms/" );
	
	//
	// Calculate hash.
	//
	var hash_vals = [];
	hash_vals.push( theFrom );
	hash_vals.push( theDest );
	hash_vals.push( thePred );
	var hash = hex_md5( hash_vals.join( "\t" ) );
	
	//
	// Init edge.
	//
	doc._id = "schemas/" + hash;
	doc._key = hash;
	doc._from = theFrom;
	doc._to = theDest;
	doc.predicate = thePred;
	
	return doc;															// ==>
	
} // CreateSchema.

/**
 * CreateSchemaOption
 *
 * This function will create a new attributes schema from an old version.
 *
 * @param string			theFrom		 	Relationship source.
 * @param string			theDest		 	Relationship destination.
 * @param string			thePred		 	Relationship predicate.
 * @param array				theOpts		 	Relationship options.
 *
 * @return object			The new schema.
 */
function CreateSchemaOption( theFrom, theDest, thePred, theOpts )
{
	//
	// Init local storage.
	//
	var doc = {};
	
	//
	// Fix collection names.
	//
	theFrom = theFrom.replace( /^smart_terms\//, "terms/" );
	theDest = theDest.replace( /^smart_shapes\//, "shapes/" );
	theDest = theDest.replace( /^smart_toponyms\//, "toponyms/" );
	thePred = thePred.replace( /^smart_terms\//, "terms/" );
	
	//
	// Fix attributes.
	//
	theOpts = theOpts.map(function(opt) {
		return opt.replace( ":type:attribute:", ":type:attribute:shape:" );
	});
	theOpts.sort();
	
	//
	// Calculate hash.
	//
	var hash_vals = [];
	hash_vals.push( theFrom );
	hash_vals.push( theDest );
	hash_vals.push( thePred );
	theOpts.forEach(function(opt) { hash_vals.push(opt); });
	var hash = hex_md5( hash_vals.join( "\t" ) );
	
	//
	// Init edge.
	//
	doc._id = "schemas/" + hash;
	doc._key = hash;
	doc._from = theFrom;
	doc._to = theDest;
	doc.predicate = thePred;
	doc.attributes = theOpts;
	
	return doc;															// ==>
	
} // CreateSchemaOption.

/**
 * CreateEdge
 *
 * This function will create a new edge from an old version.
 *
 * @param string			theFrom		 	Relationship source.
 * @param string			theDest		 	Relationship destination.
 * @param string			thePred		 	Relationship predicate.
 *
 * @return object			The new edge.
 */
function CreateEdge( theFrom, theDest, thePred )
{
	//
	// Init local storage.
	//
	var doc = {};
	
	//
	// Fix collection names.
	//
	theFrom = theFrom.replace( /^smart_toponyms\//, "toponyms/" );
	theDest = theDest.replace( /^smart_toponyms\//, "toponyms/" );
	theDest = theDest.replace( /^smart_shapes\//, "shapes/" );
	thePred = thePred.replace( /^smart_terms\//, "terms/" );
	
	//
	// Calculate hash.
	//
	var hash_vals = [];
	hash_vals.push( theFrom );
	hash_vals.push( theDest );
	hash_vals.push( thePred );
	var hash = hex_md5( hash_vals.join( "\t" ) );
	
	//
	// Init edge.
	//
	doc._id = "edges/" + hash;
	doc._key = hash;
	doc._from = theFrom;
	doc._to = theDest;
	doc.predicate = thePred;
	
	return doc;															// ==>
	
} // CreateEdge.

/**
 * CreateEdgeOption
 *
 * This function will create a new attributes edge from an old version.
 *
 * @param string			theFrom		 	Relationship source.
 * @param string			theDest		 	Relationship destination.
 * @param string			thePred		 	Relationship predicate.
 * @param array				theOpts		 	Relationship options.
 *
 * @return object			The new edge.
 */
function CreateEdgeOption( theFrom, theDest, thePred, theOpts )
{
	//
	// Init local storage.
	//
	var doc = {};
	
	//
	// Fix collection names.
	//
	theFrom = theFrom.replace( /^smart_toponyms\//, "toponyms/" );
	theDest = theDest.replace( /^smart_shapes\//, "shapes/" );
	thePred = thePred.replace( /^smart_terms\//, "terms/" );
	
	//
	// Fix attributes.
	//
	theOpts = theOpts.map(function(opt) {
		return opt.replace( ":type:attribute:", ":type:attribute:shape:" );
	});
	theOpts.sort();
	
	//
	// Calculate hash.
	//
	var hash_vals = [];
	hash_vals.push( theFrom );
	hash_vals.push( theDest );
	hash_vals.push( thePred );
	theOpts.forEach(function(opt) { hash_vals.push(opt); });
	var hash = hex_md5( hash_vals.join( "\t" ) );
	
	//
	// Init edge.
	//
	doc._id = "edges/" + hash;
	doc._key = hash;
	doc._from = theFrom;
	doc._to = theDest;
	doc.predicate = thePred;
	doc.attributes = theOpts;
	
	return doc;															// ==>
	
} // CreateEdgeOption.


/*=======================================================================================
 *	GLOBALS					.															*
 *======================================================================================*/

var buffer = [];
var limit = 1000;

/*=======================================================================================
 *	Import toponyms and shapes.															*
 *======================================================================================*/

//
// Insert toponyms.
//
db.topo_toponyms.find({}).forEach(function(doc) {
	buffer.push( CreateToponym( doc ) );
	if( buffer.length >= limit ) {
		db.toponyms.insertMany( buffer );
		buffer = [];
	}
});
if( buffer.length > 0 )
	db.toponyms.insertMany( buffer );
buffer = [];

//
// Insert shapes.
//
db.topo_shapes.find({}).forEach(function(doc) {
	buffer.push( CreateShape( doc ) );
	if( buffer.length >= limit ) {
		db.shapes.insertMany( buffer );
		buffer = [];
	}
});
if( buffer.length > 0 )
	db.toponyms.insertMany( buffer );
buffer = [];


/*=======================================================================================
 *	Import schemas & edges.																*
 *======================================================================================*/

//
// Iterate selected schemas (those not already there).
//
db.topo_schemas
	.find({ "predicate" : {
				"$in" : [
					"terms/:predicate:shape",
					"terms/:predicate:used-by",
					"terms/:predicate:instance" ] } })
		.forEach(function(doc) {
			switch( doc.predicate )
			{
				case "terms/:predicate:shape":
					buffer.push(
						CreateSchemaOption(
							doc._from,
							doc._to,
							doc.predicate,
							doc.attributes )
					);
					break;
				
				case "terms/:predicate:used-by":
				case "terms/:predicate:instance":
					buffer.push(
						CreateSchema(
							doc._from,
							doc._to,
							doc.predicate )
					);
					break;
			}
			
			if( buffer.length >= limit ) {
				db.schemas.insertMany( buffer );
				buffer = [];
			}
});

if( buffer.length > 0 ) {
	db.schemas.insertMany( buffer );
	buffer = [];
}

//
// Iterate all edges.
//
db.topo_edges
	.find({})
		.forEach(function(doc) {
			switch( doc.predicate )
			{
				case "terms/:predicate:shape":
					buffer.push(
						CreateEdgeOption(
							doc._from,
							doc._to,
							doc.predicate,
							doc.attributes )
					);
					break;
				
				case "terms/STD:geo:unit-of":
				case "terms/STD:geo:neighbour":
					buffer.push(
						CreateEdge(
							doc._from,
							doc._to,
							doc.predicate )
					);
					break;
			}
			
			if( buffer.length >= limit ) {
				db.edges.insertMany( buffer );
				buffer = [];
			}
});

if( buffer.length > 0 ) {
	db.edges.insertMany( buffer );
	buffer = [];
}


print("*=======================================================================================*");
print("* toponyms_full ==> DONE!");
print("*=======================================================================================*");
