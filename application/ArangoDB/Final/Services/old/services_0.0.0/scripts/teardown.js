'use strict';

/**
 * Teardown and drop collections
 *
 * This script will drop all required collections.
 */

const db = require('@arangodb').db;
const Application = require( '../utils/Application' );

//
// Drop document collections.
//
for( const collection of Application.documentCollections ) {
	if( db._collection( collection.name ) ) {
		db._drop( collection.name );
	} else if( module.context.isProduction ) {
		console.debug( `Document collection [${collection.name}] does not exist.` );
	}
}

//
// Create edge collections.
//
for( const collection of Application.edgeCollections ) {
	if( db._collection( collection.name ) ) {
		db._drop( collection.name );
	} else if( module.context.isProduction ) {
		console.debug( `Edge collection [${collection.name}] does not exist.` );
	}
}
