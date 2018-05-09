'use strict';

const httpError = require('http-errors');
const errors = require('@arangodb').errors;
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;

//
// Set routes.
//
module.context.use('/settings', require('./routes/settings'), 'settings');
module.context.use('/sessions', require('./routes/sessions'), 'sessions');
module.context.use('/logs', require('./routes/logs'), 'logs');
module.context.use('/messages', require('./routes/messages'), 'messages');
module.context.use('/users', require('./routes/users'), 'users');
module.context.use('/groups', require('./routes/groups'), 'groups');
module.context.use('/terms', require('./routes/terms'), 'terms');
module.context.use('/descriptors', require('./routes/descriptors'), 'descriptors');
module.context.use('/studies', require('./routes/studies'), 'studies');
module.context.use('/annexes', require('./routes/annexes'), 'annexes');
module.context.use('/smart', require('./routes/smart'), 'smart');
module.context.use('/toponyms', require('./routes/toponyms'), 'toponyms');
module.context.use('/shapes', require('./routes/shapes'), 'shapes');
module.context.use('/schemas', require('./routes/schemas'), 'schemas');
module.context.use('/edges', require('./routes/edges'), 'edges');
module.context.use('/hierarchies', require('./routes/hierarchies'), 'hierarchies');
module.context.use('/links', require('./routes/links'), 'links');

module.context.use('/test', require('./routes/test'), 'test');

const db = require('@arangodb').db;
const Status = require( './utils/Status' );				// Status module.
const Setting = require( './utils/Setting' );			// Settings constants.
const Collection = require( './utils/Collection' );		// Collection constants.
const Collections = require( './utils/Collections' );	// Collection lists constants.

//
// Set sessions middleware.
//
const cookieTransport = require('@arangodb/foxx/sessions/transports/cookie');
const sessionsMiddleware = require( '@arangodb/foxx/sessions' );
const secret = module.context.configuration.cookieSecret;
const sessions = sessionsMiddleware({
	storage: db._collection( Collection.session.name ),
	transport: cookieTransport({
		name: 'FOXXSESSID',
		ttl: 60 * 60 * 24 * 7, // one week in seconds
		algorithm: 'sha256',
		secret: secret
	})
});
module.context.use( sessions );

//
// Set environment info in request:
//
//	- Set current user uid.
//	- Set application status.
//
const users = db._collection( Collection.user.name );
module.context.use(

	(request, response, next) =>
	{
		//
		// Handle current user.
		//
		if( request.session.uid ) {
			try
			{
				request.user = users.document( request.session.uid );
			}
			catch( error )
			{
				request.session.uid = null;
				request.session.data = {};
			}
		}
		else
		{
			request.session.uid = null;
			request.session.data = {};
		}

		//
		// Save session data.
		//
		request.sessionStorage.save();

		//
		// Set application status.
		//
		request.applicationData = {
			status : {}
		};

		//
		// Set status.
		//
		try
		{
			request.applicationData.status = Status.get();
		}
		catch( error )
		{
			response.throw( error );											// !@! ==>
		}

		next();
	}
);
