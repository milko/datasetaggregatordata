/**
 * toponyms_partial.js
 *
 * This script will load the partial set of toponyms into the smart database.
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
 *	Import schemas, toponyms and shapes.												*
 *======================================================================================*/

//
// Iterate relevant schemas.
//
db.topo_schemas
	.find({ "predicate" : {
				"$in" : [
					"smart_terms/:predicate:shape",
					"smart_terms/:predicate:used-by",
					"smart_terms/:predicate:instance" ] } })
		.forEach(function(doc) {
		
			//
			// Fix schema.
			//
			switch( doc.predicate )
			{
				case "smart_terms/:predicate:shape":
					
					//
					// Create shape.
					//
					var shape =
						CreateShape(
							db.topo_shapes.findOne({ "_id" : doc._to })
						);
					
					//
					// Get edge.
					//
					var edge = CreateSchemaOption(
							doc._from,
							shape._id,
							doc.predicate,
							doc.attributes );
					
					//
					// Create shape.
					//
					if( db.shapes.findOne({ "_id" : shape._id }) === null ) {
						db.shapes.insertOne( shape );
					}
					
					//
					// Create edge.
					//
					db.schemas.insertOne( edge );
					
					break;
				
				case "smart_terms/:predicate:used-by":
				case "smart_terms/:predicate:instance":
					
					//
					// Create toponym.
					//
					var toponym =
						CreateToponym(
							db.topo_toponyms.findOne({ "_id" : doc._to })
						);
					
					//
					// Get edge.
					//
					var edge = CreateSchema(
							doc._from,
							toponym._id,
							doc.predicate );
					
					//
					// Create toponym.
					//
					if( db.toponyms.findOne({ "_id" : toponym._id }) === null ) {
						db.toponyms.insertOne( toponym );
					}
					
					//
					// Create edge.
					//
					db.schemas.insertOne( edge );
					
					break;
			}
});


/*=======================================================================================
 *	Import edges.																		*
 *======================================================================================*/

//
// Iterate edges.
//
db.topo_edges
	.find({})
		.forEach(function(doc) {
			//
			// Convert.
			//
			var edge = null;
			switch( doc.predicate )
			{
				case "smart_terms/:predicate:shape":
				
					//
					// Create shape.
					//
					var shape =
						CreateShape(
							db.topo_shapes.findOne({ "_id" : doc._to })
						);
					
					//
					// Create toponym.
					//
					var toponym =
						CreateToponym(
							db.topo_toponyms.findOne({ "_id" : doc._to })
						);
					
					//
					// Fix edge.
					//
					edge = CreateEdgeOption(
							doc._from,
							(shape !== null) ? shape._id : toponym._id,
							doc.predicate,
							doc.attributes );
			
					//
					// Check.
					//
					if( (db.toponyms.findOne({ "_id" : edge._from }) !== null)
					 && ( (db.toponyms.findOne({ "_id" : edge._to }) !== null)
					   || (db.shapes.findOne({ "_id" : edge._to }) !== null) ) ) {
					 	db.edges.insertOne( edge );
					}
					 
					break;
		
				case "smart_terms/STD:geo:unit-of":
				case "smart_terms/STD:geo:neighbour":
					
					//
					// Fix edge.
					//
					edge = CreateEdge(
							doc._from,
							doc._to,
							doc.predicate );
			
					//
					// Check.
					//
					if( (db.toponyms.findOne({ "_id" : edge._from }) !== null)
					 && (db.toponyms.findOne({ "_id" : edge._to }) !== null) ) {
					 	db.edges.insertOne( edge );
					}

					break;
			}
});


print("*=======================================================================================*");
print("* toponyms_partial ==> DONE!");
print("*=======================================================================================*");
