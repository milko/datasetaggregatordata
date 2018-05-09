'use strict';

//
// Load database resources.
//
const db = require('@arangodb').db;

//
// Set collection name.
//
const collectionName = 'myFoxxCollection';

//
// Create collection if necessary.
//
if(! db._collection( collectionName )) {
	db._createDocumentCollection( collectionName );
} else if (module.context.isProduction) {
	console.debug(`collection ${collectionName} already exists. Leaving it untouched.`)
}
