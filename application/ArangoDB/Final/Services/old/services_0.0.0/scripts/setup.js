'use strict';

/**
 * Initialise and setup
 *
 * This script is called when the service is installed,
 * it will perform the following actions:
 *
 * 	- Create all required collections.
 * 	- Set application status to 'uninited'.
 */

const Status = require( '../utils/Status' );

//
// Create collections and set status.
//
Status.set( true, true );
