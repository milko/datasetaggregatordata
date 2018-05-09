'use strict';

const db = require('@arangodb').db;				// Import database class.
const collectionName = 'myFoxxCollection';		// Set collection name.

if ( ! db._collection(collectionName ) ) {		// Create collection if not there.
  db._createDocumentCollection( collectionName );
}

//
// Create my collections.
//
for( const collection of [ "terms", "descriptors" ] ) {
	if ( ! db._collection( collection )) {
	  db._createDocumentCollection( collection );
	}
}
