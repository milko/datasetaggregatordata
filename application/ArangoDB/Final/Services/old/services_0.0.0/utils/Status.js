'use strict';

/**
 * Status
 *
 * This module contains status utilities:
 *
 * 	- get:		Retrieve the current status.
 * 	- set:		Create/update the current status; the service will create the required
 * 				collections if the parameter to the function is true.
 *
 * All services return an object structured as follows:
 *
 * 	- error	{Number}  :	The error code, 0 is success.
 * 	- message {String}:	The error message, 'OK' is success.
 * 	- status (Object) : The current status.
 */

/**
 * Initialise status
 *
 * This script is called when the settings are missing the status.
 */

const db = require('@arangodb').db;
const errors = require('@arangodb').errors;
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;

const Setting = require( '../utils/Setting' );			// Settings constants.
const Collection = require( '../utils/Collection' );	// Collection constants.
const Collections = require( '../utils/Collections' );	// Collection lists constants.

module.exports = {

	/**
	 * Get current status
	 *
	 * Returns the current status record as:
	 * 	- error:	0 if successful.
	 * 	- message:	'OK' if successful.
	 * 	- status:	The current status, or null if unsuccessful.
	 */
	get : () => {

		//
		// Init local storage.
		//
		const data = {
			error : 0,
			message : 'OK',
			status : null
		};

		//
		// Check collection.
		//
		const collection = db._collection( Collection.setting.name );
		if( collection )
		{
			//
			// Check status.
			//
			try
			{
				data.status = collection.document( Setting.status.key );
			}
			catch( error )
			{
				if( error.isArangoError
				 && (error.errorNum === ARANGO_NOT_FOUND) )
				{
					data.error = 404;
					data.message = 'Missing settings status.';
				}
				else
				{
					throw error;												// !@! ==>
				}
			}
		}
		else
		{
			data.error = 404;
			data.message = 'Missing settings collection.';
		}

		return data;																// ==>
	},

	/**
	 * Set/update collections status
	 *
	 * Iterate all collections and update the collection counts; if the parameter
	 * is true, create the necessary collections.
	 * Update/insert the status in settings.
	 * Will integrate eventual existing other status elements.
	 *
	 * @param	doCreateIndexes		{Boolean}	True means create/update indexes.
	 * @param	doCreateCollections	{Boolean}	True means create collections if not there.
	 */
	set : ( doCreateIndexes = false, doCreateCollections = false ) => {

		//
		// Init status data.
		//
		const data = {};
		const counts = {};

		data[ Setting.status.app ] = null;
		data[ Setting.status.col ] = counts;

		//
		// Check document collections.
		//
		for( const item of Collections.document )
		{
			const name = item.name;
			const collection = db._collection( name );

			if( ! collection ) {
				counts[ name ] = 0;

				if( doCreateCollections ) {
					db._createDocumentCollection( name );
				}
			} else {
				counts[ name ] = collection.count();
			}
		}

		//
		// Check edge collections.
		//
		for( const item of Collections.edge )
		{
			const name = item.name;
			const collection = db._collection( name );

			if( ! collection ) {
				counts[ name ] = 0;
				if( doCreateCollections ) {
					db._createEdgeCollection( name );
				}
			} else {
				counts[ name ] = collection.count();
			}
		}

		//
		// Create indexes.
		//
		if( doCreateIndexes )
		{
			//
			// Handle document collections.
			//
			for( const item of Collections.document )
			{
				const collection = db._collection( item.name );
				if( collection ) {
					for( const index of item.index ) {
						collection.ensureIndex( index );
					}
				}
			}

			//
			// Handle edge collections.
			//
			for( const item of Collections.edge )
			{
				const collection = db._collection( item.name );
				if( collection ) {
					for( const index of item.index ) {
						collection.ensureIndex( index );
					}
				}
			}
		}

		//
		// Update collection status.
		//
		// To be usable, the application requires:
		// 	- terms
		// 	- descriptors
		// 	- schemas
		//

		//
		// Get current status.
		//
		const colname = Collection.setting.name;
		const collection = db._collection( colname );
		const current
			= ( counts[ colname ] )
			? collection.document( Setting.status.key )
			: null;

		//
		// Handle missing required collections.
		//
		if( (counts[ Collection.term.name ] === 0)
			|| (counts[ Collection.descriptor.name ] === 0)
			|| (counts[ Collection.schema.name ] === 0) ) {
			data[ Setting.status.app ] = Setting.status.state.empty;
		}

		//
		// Handle current status.
		//
		else if( current ) {
			data[ Setting.status.app ] = current[ Setting.status.app ];
		}

		//
		// Set OK status.
		//
		else {
			data[ Setting.status.app ] = Setting.status.state.ok;
		}

		//
		// Update settings.
		//
		if( current !== null ) {
			return(
				collection.update(
					current._id,
					data,
					{ overwrite : true, returnNew : true, keepNull : false }
				)
			);																		// ==>
		}

		//
		// Insert settings.
		//
		counts[ colname ]++;
		return(
			collection.save(
				Object.assign( { _key : Setting.status.key }, data ),
				{ returnNew : true }
			)
		);																			// ==>
	}
};
