/**
 * ImportStandards.js
 *
 * This script will load the standards from the standards database.
 */


/*=======================================================================================
 *										FUNCTIONS										*
 *======================================================================================*/

/**
 * InitTerm
 *
 * This function will create a term document in accordance to the provided standards term
 * document. The function will only fill properties up to the deploy property.
 *
 * The function expects the keywords to be provided and will handle the collection name
 * change.
 *
 * @param object			theTerm		 	Standards term document.
 * @param array				theKeywords	 	List of keywords.
 *
 * @return object			Initialised new term.
 */
function InitTerm( theTerm, theKeywords )
{
	//
	// Init local storage.
	//
	var new_doc = {};
	
	//
	// Load document.
	//
	new_doc._id = theTerm._id;
	new_doc._key = theTerm._key;
	new_doc.nid = theTerm.nid;
	new_doc.lid = theTerm.lid;
	new_doc.gid = theTerm.gid;
	
	//
	// MILKO - Skipping variable name since
	// occurring characters also include apostrophes:
	// need to find a strategy.
	//
// 	new_doc.var = MakeVariableName( new_doc.gid );

	if( theTerm.hasOwnProperty( "symbol" ) )
		new_doc.sym = theTerm.symbol;
	if( theTerm.hasOwnProperty( "synonym" ) )
		new_doc.syn = theTerm.synonym;
	new_doc.keyword = theKeywords;
	new_doc.deploy = ( theTerm.hasOwnProperty( "deploy" ) )
				   ? theTerm.deploy
				   : ":state:application:standard";
	
	//
	// Add namespace instance.
	//
	bulk_ns
		.find({ "_id" : new_doc.nid })
			.updateOne({ "$addToSet" : { "instances" : ":instance:namespace" } });
	if( ++bulk_ns_count === 1000 ) {
		bulk_ns.execute();
		bulk_ns = db.terms.initializeOrderedBulkOp();
	}
	
	return new_doc;														// ==>

} // InitTerm.

/**
 * AddSchemaBranch
 *
 * This function will create and add a schema branch from the provided parameters.
 *
 * @param string			theFrom		 	Relationship source.
 * @param string			theDest		 	Relationship destination.
 * @param string			thePred		 	Relationship predicate.
 * @param array				theBranch	 	Relationship branches.
 */
function AddSchemaBranch( theFrom, theDest, thePred, theBranch )
{
	//
	// Init local storage.
	//
	var doc = {};
	
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
	
	//
	// Fix branch collection names.
	//
	var branches = null;
	if( theBranch !== null ) {
		branches = theBranch;
	}

	//
	// Check if it exists.
	//
	var filter = { "_id" : doc._id };
	var existing = db.schemas.findOne( filter );
	if( existing !== null ) {
		//
		// Handle branches.
		//
		if( branches !== null ) {
			branches.forEach(function(branch) {
				//
				// Add branch.
				//
				db.schemas.updateOne(
					filter,
					{ "$addToSet" : { "branches" : branch } },
					{ "$upsert" : false }
				);
			});
		}
	}
	
	//
	// Handle new edge.
	//
	else {
		//
		// Handle branches.
		//
		if( branches !== null ) {
			doc.branches = branches;
		}
		
		//
		// Insert edge.
		//
		db.schemas.insert( doc );
	}
	
} // AddSchemaBranch.

/**
 * AddSchemaInstance
 *
 * This function will update the instance references of the provided edge terms.
 *
 * The function should be called after inserting all edges.
 *
 * @param string			theFrom		 	Relationship source.
 * @param string			theDest		 	Relationship destination.
 * @param string			thePred		 	Relationship predicate.
 * @param array				theBranch	 	Relationship branches.
 */
function AddSchemaInstance( theFrom, theDest, thePred, theBranch )
{
	//
	// Handle branches.
	//
	var branches = null;
	if( theBranch !== null ) {
		//
		// Fix branch collection names.
		//
		branches = theBranch;

		//
		// Update branch instances.
		//
		branches.forEach(function(branch) {
			if( (thePred == "terms/:predicate:enum-of" )
			 || (thePred == "terms/:predicate:category-of" ) ) {
			 	bulk_docs
			 		.find({ "_id" : branch })
			 			.updateOne(
							{ "$addToSet" : { "instances" : ":instance:enumeration" } }
						);
				if( ++bulk_count === 1000 ) {
					bulk_docs.execute();
					bulk_docs = db.terms.initializeUnorderedBulkOp();
				}
			}
		});
	}
	
	//
	// Add predicate instance.
	//
	bulk_docs
		.find({ "_id" : thePred })
			.updateOne(
				{ "$addToSet" : { "instances" : ":instance:predicate" } }
			);
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
	
	//
	// Add category or seletion instances.
	//
	if( thePred == "terms/:predicate:category-of" ) {
		bulk_docs
			.find({ "_id" : theFrom })
				.updateOne(
					{ "$addToSet" : { "instances" : ":instance:category" } }
				);
		if( ++bulk_count === 1000 ) {
			bulk_docs.execute();
			bulk_docs = db.terms.initializeUnorderedBulkOp();
		}
	} else if( thePred == "terms/:predicate:enum-of" ) {
		bulk_docs
			.find({ "_id" : theFrom })
				.updateOne(
					{ "$addToSet" : { "instances" : ":instance:selection" } }
				);
		if( ++bulk_count === 1000 ) {
			bulk_docs.execute();
			bulk_docs = db.terms.initializeUnorderedBulkOp();
		}
	}
	
} // AddSchemaInstance.

/**
 * AddDescriptions
 *
 * This function will add the standard description properties to the provided term.
 *
 * @param object			theOld		 	Original document.
 * @param object			theNew		 	New document, will receive changes.
 */
function AddDescriptions( theOld, theNew )
{
	//
	// Load document.
	//
	if( theOld.hasOwnProperty( "label" ) )
		theNew.label = theOld.label;
	if( theOld.hasOwnProperty( "definition" ) )
		theNew.definition = theOld.definition;
	if( theOld.hasOwnProperty( "description" ) )
		theNew.description = theOld.description;
	if( theOld.hasOwnProperty( "example" ) )
		theNew.example = theOld.example;
	if( theOld.hasOwnProperty( "note" ) )
		theNew.note = theOld.note;
	if( theOld.hasOwnProperty( "names" ) )
		theNew.names = theOld.names;

} // AddDescriptions.

/**
 * MakeVariableName
 *
 * This function will return a term variable name according to the provided term global
 * identifier.
 *
 * @param string			theIdentifier 	Term global identifier.
 *
 * @return string			Term variable name.
 */
function MakeVariableName( theIdentifier )
{
	//
	// Replace diacritics with spaces.
	//
	var name = theIdentifier.replace( /\:/g, ' ' );
	name = name.replace( /\-/g, '_' );
	
	//
	// Lowercase.
	//
	name = name.toLowerCase();
	
	//
	// Capitalise.
	//
	name = name.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
	
	return 'k' + name.replace( / /g, '' );								// ==>

} // MakeVariableName.

/**
 * NormaliseWBIndicatorDocument
 *
 * This function will normalise the provided TERMS_WB_indicator document.
 *
 * @param object			theDocument 	Term document.
 *
 * @return object			Normalised document.
 */
function NormaliseWBIndicatorDocument( theDocument )
{
	//
	// Init local storage.
	//
	var new_obj = JSON.parse(JSON.stringify(theDocument));
	var fields = [ "_id", "_key", "lid", "gid", "const", "symbol" ];

	//
	// Replace periods with underscores.
	//
	fields.forEach( function(field) {
		new_obj[ field ] = theDocument[ field ].replace( /\./g, '_' );
	});
	
	//
	// Add new synonym.
	//
	if( (new_obj.lid !== theDocument.lid)
	 && new_obj.hasOwnProperty( 'synonym' ) )
		new_obj.synonym.push( new_obj.lid );
	
	return new_obj;														// ==>

} // NormaliseWBIndicatorDocument.


/*=======================================================================================
 *										GLOBALS											*
 *======================================================================================*/

var bulk_count, bulk_docs;
var bulk_ns_count, bulk_ns;


/*=======================================================================================
 *	Import ISO terms.																	*
 *======================================================================================*/

//
// TERMS_ISO_15924.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_ISO_15924.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "ISO", "language", "script" ] );
	if( doc.hasOwnProperty( "STD_language" ) )
		new_doc.STD_language = doc.STD_language;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_ISO_639_2.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_ISO_639_2.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "ISO", "language" ] );
	if( doc.hasOwnProperty( "ISO_639_1_Part1" ) )
		new_doc.ISO_639_1_Part1 = doc.ISO_639_1_Part1;
	if( doc.hasOwnProperty( "ISO_639_2_Part2T" ) )
		new_doc.ISO_639_2_Part2T = doc.ISO_639_2_Part2T;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_ISO_639_3.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_ISO_639_3.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "ISO", "language" ] );
	if( doc.hasOwnProperty( "ISO_639_1_Part1" ) )
		new_doc.ISO_639_1_Part1 = doc.ISO_639_1_Part1;
	if( doc.hasOwnProperty( "ISO_639_2_Part2B" ) )
		new_doc.ISO_639_2_Part2B = doc.ISO_639_2_Part2B;
	if( doc.hasOwnProperty( "ISO_639_2_Part2T" ) )
		new_doc.ISO_639_2_Part2T = doc.ISO_639_2_Part2T;
	if( doc.hasOwnProperty( "ISO_639_scope" ) )
		new_doc.ISO_639_scope = doc.ISO_639_scope;
	if( doc.hasOwnProperty( "ISO_639_type" ) )
		new_doc.ISO_639_type = doc.ISO_639_type;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_ISO_639_5.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_ISO_639_5.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "ISO", "language", "group", "family" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_ISO_639_LOCALE.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_ISO_639_LOCALE.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "ISO", "language", "locale" ] );
	if( doc.hasOwnProperty( "STD_country" ) )
		new_doc.STD_country = doc.STD_country;
	if( doc.hasOwnProperty( "STD_language" ) )
		new_doc.STD_language = doc.STD_language;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_ISO_3166_1.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_ISO_3166_1.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "ISO", "country" ] );
	if( doc.hasOwnProperty( "ISO_3166_1_alpha_2" ) )
		new_doc.ISO_3166_1_alpha_2 = doc.ISO_3166_1_alpha_2;
	if( doc.hasOwnProperty( "ISO_3166_1_alpha_3" ) )
		new_doc.ISO_3166_1_alpha_3 = doc.ISO_3166_1_alpha_3;
	if( doc.hasOwnProperty( "ISO_3166_1_numeric" ) )
		new_doc.ISO_3166_1_numeric = doc.ISO_3166_1_numeric;
	if( doc.hasOwnProperty( "logo" ) )
		new_doc.logo = doc.logo;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_ISO_3166_2.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_ISO_3166_2.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "ISO", "country", "subdivision" ] );
	var tmp = new_doc.lid.split( '-' );
	if( tmp.length == 2 ) {
		new_doc.syn.push( tmp[ 0 ] + '.' + tmp[ 1 ] );
		new_doc.syn.push( tmp[ 1 ] );
	}
	if( doc.hasOwnProperty( "STD_country" ) )
		new_doc.STD_country =
			doc.STD_country.replace( /^terms\//, '' );
	if( doc.hasOwnProperty( "STD_geo_type" ) )
		new_doc.STD_geo_type = doc.STD_geo_type;
	if( doc.hasOwnProperty( "logo" ) )
		new_doc.logo = doc.logo;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_ISO_3166_3.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_ISO_3166_3.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "ISO", "country", "legacy", "former" ] );
	if( doc.hasOwnProperty( "ISO_3166_3_alpha_2" ) )
		new_doc.ISO_3166_3_alpha_2 = doc.ISO_3166_3_alpha_2;
	if( doc.hasOwnProperty( "ISO_3166_3_alpha_3" ) )
		new_doc.ISO_3166_3_alpha_3 = doc.ISO_3166_3_alpha_3;
	if( doc.hasOwnProperty( "ISO_3166_3_alpha_4" ) )
		new_doc.ISO_3166_3_alpha_4 = doc.ISO_3166_3_alpha_4;
	if( doc.hasOwnProperty( "ISO_3166_3_numeric" ) )
		new_doc.ISO_3166_3_numeric = doc.ISO_3166_3_numeric;
	if( doc.hasOwnProperty( "logo" ) )
		new_doc.logo = doc.logo;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_ISO_3166_TYPE.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_ISO_3166_TYPE.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "ISO", "country", "subset", "type" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_ISO_4217.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_ISO_4217.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "ISO", "currency" ] );
	if( doc.hasOwnProperty( "ISO_4217_alpha_3" ) )
		new_doc.ISO_4217_alpha_3 = doc.ISO_4217_alpha_3;
	if( doc.hasOwnProperty( "ISO_4217_numeric" ) )
		new_doc.ISO_4217_numeric = doc.ISO_4217_numeric;
	if( doc.hasOwnProperty( "ISO_4217_fraction" ) )
		new_doc.ISO_4217_fraction = doc.ISO_4217_fraction;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();


/*=======================================================================================
 *	Import World Bank terms.															*
 *======================================================================================*/

//
// TERMS_WB_income.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_WB_income.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "World Bank", "income" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_WB_lending.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_WB_lending.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "World Bank", "lending" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_WB_region.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_WB_region.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "World Bank", "region" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_WB_country.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_WB_country.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "World Bank", "political" ] );
	if( doc.hasOwnProperty( "STD_geo_politic" ) )
		new_doc.STD_geo_politic = doc.STD_geo_politic;
	if( doc.hasOwnProperty( "STD_geo_admin" ) )
		new_doc.STD_geo_admin = doc.STD_geo_admin;
	if( doc.hasOwnProperty( "WB_capital_city" ) )
		new_doc.WB_capital_city = doc.WB_capital_city;
	if( doc.hasOwnProperty( "WB_income" )
	 && (doc.WB_income !== "WB:income:NA") )
		new_doc.WB_income = doc.WB_income;
	if( doc.hasOwnProperty( "WB_lending" ) )
		new_doc.WB_lending = doc.WB_lending;
	if( doc.hasOwnProperty( "logo" ) )
		new_doc.logo = doc.logo;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_WB_source.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_WB_source.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "World Bank", "source" ] );
	if( doc.hasOwnProperty( "STD_avail_data" ) )
		new_doc.STD_avail_data = doc.STD_avail_data;
	if( doc.hasOwnProperty( "STD_avail_meta" ) )
		new_doc.STD_avail_meta = doc.STD_avail_meta;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_WB_topic.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_WB_topic.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "World Bank", "topic" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_WB_indicator.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_WB_indicator.find({}).forEach(function(doc) {
	doc = NormaliseWBIndicatorDocument( doc );
	var new_doc = InitTerm( doc, [ "World Bank", "indicator" ] );
	if( doc.hasOwnProperty( "WB_source" ) )
		new_doc.WB_source = doc.WB_source;
	if( doc.hasOwnProperty( "WB_topic" ) )
		new_doc.WB_topic = doc.WB_topic;
	if( doc.hasOwnProperty( "WB_org" ) )
		new_doc.WB_org = doc.WB_org;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();


/*=======================================================================================
 *	Import FIPS terms.																	*
 *======================================================================================*/

//
// TERMS_FIPS_class.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_FIPS_class.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "FIPS", "feature", "class" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_FIPS_type.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_FIPS_type.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "FIPS", "feature", "type" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_FIPS_political.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_FIPS_political.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "FIPS", "political" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_FIPS_admin.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_FIPS_admin.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "FIPS", "administrative unit" ] );
	if( doc.hasOwnProperty( "STD_geo_type" ) )
		new_doc.STD_geo_type = doc.STD_geo_type;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();


/*=======================================================================================
 *	Import GEOnet terms.																*
 *======================================================================================*/

//
// TERMS_GEOnet_languages.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_GEOnet_languages.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "GEOnet", "language" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_GEOnet_transd.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_GEOnet_transd.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "GEOnet", "names", "transliteration" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_GEOnet_ntype.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_GEOnet_ntype.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "GEOnet", "names", "type" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_GEOnet_fclass.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_GEOnet_fclass.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "GEOnet", "feature", "class" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_GEOnet_ftype.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_GEOnet_ftype.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "GEOnet", "feature", "type" ] );
	if( doc.hasOwnProperty( "STD_geo_class" ) )
		new_doc.STD_geo_class = doc.STD_geo_class;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_GEOnet_countries.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_GEOnet_countries.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "GEOnet", "political" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_GEOnet_ADM1.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_GEOnet_ADM1.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "GEOnet", "administrative unit" ] );
	if( doc.hasOwnProperty( "STD_country" ) )
		new_doc.STD_country = doc.STD_country;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();


/*=======================================================================================
 *	Import Geonames terms.																*
 *======================================================================================*/

//
// TERMS_GN_language.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_GN_language.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "Geonames", "language" ] );
	if( doc.hasOwnProperty( "STD_language" ) )
		new_doc.STD_language = doc.STD_language;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_GN_fclass.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_GN_fclass.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "Geonames", "feature", "class" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_GN_ftype.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_GN_ftype.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "Geonames", "feature", "class" ] );
	if( doc.hasOwnProperty( "STD_geo_class" ) )
		new_doc.STD_geo_class = doc.STD_geo_class;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_GN_continents.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_GN_continents.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "Geonames", "continent" ] );
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();

//
// TERMS_GN_admin.
//
bulk_ns_count = 0;
bulk_ns = db.terms.initializeOrderedBulkOp();
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.TERMS_GN_admin.find({}).forEach(function(doc) {
	var new_doc = InitTerm( doc, [ "Geonames", "administrative unit" ] );
	if( doc.hasOwnProperty( "GN_id" ) )
		new_doc.GN_id = doc.GN_id;
	if( doc.hasOwnProperty( "STD_country" ) )
		new_doc.STD_country = doc.STD_country;
	if( doc.hasOwnProperty( "STD_geo_admin" ) )
		new_doc.STD_geo_admin = doc.STD_geo_admin;
	if( doc.hasOwnProperty( "STD_geo_type" ) )
		new_doc.STD_geo_type = doc.STD_geo_type;
	if( doc.hasOwnProperty( "IATA_code" ) )
		new_doc.IATA_code = doc.IATA_code;
	if( doc.hasOwnProperty( "STD_nom_post_code" ) )
		new_doc.STD_nom_post_code = doc.STD_nom_post_code;
	AddDescriptions( doc, new_doc );
	bulk_docs.insert( new_doc );
	if( ++bulk_count === 1000 ) {
		bulk_docs.execute();
		bulk_docs = db.terms.initializeUnorderedBulkOp();
	}
});
bulk_docs.execute();
bulk_ns.execute();


/*=======================================================================================
 *	Import ISO schemas.																	*
 *======================================================================================*/

//
// SCHEMAS_ISO_15924.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_ISO_15924.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_ISO_15924.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_ISO_639_2.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_ISO_639_2.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_ISO_639_2.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_ISO_639_3.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_ISO_639_3.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_ISO_639_3.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_ISO_639_5.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_ISO_639_5.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_ISO_639_5.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_ISO_639_LOCALE.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_ISO_639_LOCALE.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_ISO_639_LOCALE.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_ISO_3166_TYPE.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_ISO_3166_TYPE.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = [ dest ];
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_ISO_3166_TYPE.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = [ dest ];
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_ISO_3166_1.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_ISO_3166_1.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_ISO_3166_1.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_ISO_3166_2.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_ISO_3166_2.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_ISO_3166_2.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_ISO_3166_3.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_ISO_3166_3.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_ISO_3166_3.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_ISO_4217.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_ISO_4217.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_ISO_4217.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();


/*=======================================================================================
 *	Import World Bank schemas.															*
 *======================================================================================*/

//
// SCHEMAS_WB_income.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_WB_income.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_WB_income.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_WB_lending.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_WB_lending.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_WB_lending.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_WB_region.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_WB_region.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_WB_region.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_WB_country.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_WB_country.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_WB_country.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_WB_source.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_WB_source.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_WB_source.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_WB_topic.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_WB_topic.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_WB_topic.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_WB_indicator.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_WB_indicator.find({}).forEach(function(doc) {
	var from = doc._from.replace( /\./g, '_' );
	var dest = doc._to.replace( /\./g, '_' );
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_WB_indicator.find({}).forEach(function(doc) {
	var from = doc._from.replace( /\./g, '_' );
	var dest = doc._to.replace( /\./g, '_' );
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();


/*=======================================================================================
 *	Import FIPS schemas.																*
 *======================================================================================*/

//
// SCHEMAS_FIPS_class.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_FIPS_class.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_FIPS_class.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_FIPS_type.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_FIPS_type.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_FIPS_type.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_FIPS_political.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_FIPS_political.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_FIPS_political.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_FIPS_admin.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_FIPS_admin.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_FIPS_admin.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();


/*=======================================================================================
 *	Import GEOnet schemas.																*
 *======================================================================================*/

//
// SCHEMAS_GEOnet_languages.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_GEOnet_languages.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_GEOnet_languages.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_GEOnet_transd.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_GEOnet_transd.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_GEOnet_transd.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_GEOnet_ntype.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_GEOnet_ntype.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_GEOnet_ntype.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_GEOnet_fclass.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_GEOnet_fclass.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_GEOnet_fclass.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_GEOnet_ftype.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_GEOnet_ftype.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_GEOnet_ftype.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_GEOnet_countries.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_GEOnet_countries.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_GEOnet_countries.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_GEOnet_ADM1.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_GEOnet_ADM1.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_GEOnet_ADM1.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();


/*=======================================================================================
 *	Import Geonames schemas.															*
 *======================================================================================*/

//
// SCHEMAS_GN_language.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_GN_language.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_GN_language.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_GN_fclass.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_GN_fclass.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_GN_fclass.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_GN_ftype.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_GN_ftype.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_GN_ftype.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_GN_continents.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_GN_continents.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_GN_continents.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();

//
// SCHEMAS_GN_admin.
//
bulk_count = 0;
bulk_docs = db.terms.initializeUnorderedBulkOp();
db.SCHEMAS_GN_admin.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaBranch( from, dest, pred, branches );
});
db.SCHEMAS_GN_admin.find({}).forEach(function(doc) {
	var from = doc._from;
	var dest = doc._to;
	var pred = doc.predicate;
	var branches = ( doc.hasOwnProperty( "branches" ) ) ? doc.branches : null;
	AddSchemaInstance( from, dest, pred, branches );
});
bulk_docs.execute();


print("*=======================================================================================*");
print("* ImportStandards ==> DONE!");
print("*=======================================================================================*");
