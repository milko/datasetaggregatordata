/**
 * Create administrator user
 *
 * Path: __/admin__
 *
 * This service will create the administrator user if none of the default
 * collections are present in the database.
 *
 * The service will first check if any of the following collections exist:
 * terms, descriptors, schemas and users: if that is the case, the service
 * will fail; if that is not the case, the service will parse the provided
 * form, create the administrator user and log her/him in.
 *
 * @param   request {Object}    The properties of the new administrator user.
 * @param   response {Object}   The result of the operation {success: true}
 *
 * The __request__ parameter requires the following properties:
 *  - name {String}     The administrator's name.
 *  - email {String}    The administrator's e-mail address.
 *  - pass {String}     The administrator's desired password.
 *  - hash {String}     The authorisation hash.
 */
router.post(
	'/admin',
	(request, response) => {

		const file = '../data/admin.json';
		const collections = [ "terms", "descriptors", "schemas", "users" ];
		const roles = [
			':enum:role:user', ':enum:role:batch', ':enum:role:upload',
			':enum:role:meta', ':enum:role:sync', ':enum:role:suggest',
			':enum:role:dict', ':enum:role:commit', ':enum:role:query',
			':enum:role:download'
		];

		//
		// Check if database is empty.
		//
		for(let collection of collections) {
			if( db._collection( collection ) ) {
				response.throw( 403,
					"Database is already initialised."
				);                                                      // ==>
			}
		}

		//
		// Check hash file.
		//
		if( ! fs.isFile( file ) ) {
			response.throw( 404,
				"Unable to locate authentication data."
			);                                                          // ==>
		}

		//
		// Check hash.
		//
		try {
			const hash = JSON.parse( fs.readFileSync( file,'utf8' ) );
		} catch(error) {
			response.throw( 500,
				"Unable to load authentication data.",
				error
			);                                                          // ==>
		}
		if( (! request.body.hasOwnProperty( 'hash' ))
		    || (request.body.hash !== hash.hash) ) {
			response.throw( 403,
				"Invalid authorisation."
			);                                                          // ==>
		}

		//
		// Create administrator.
		//
		try
		{
			//
			// Create collection.
			//
			db._createDocumentCollection( 'users' );
			const users = module.context.collection( 'users' );
			users.ensureIndex({
				type: 'hash',
				fields: [ 'username' ],
				unique: true
			});

			//
			// Create user record.
			//
			const user = {};
			user.username = 'admin';
			user.name = request.body.name;
			user.email = request.body.email;
			user.language = request.body.language;
			user.rank = ':rank:system';
			user.role = roles;
			user.authData = createAuth( req.body.pass );

			//
			// Save user.
			//
			const meta = users.save( user );

			//
			// Return user information.
			//
			Object.assign( user, meta );
		}

			//
			// Handle errors.
			//
		catch(error)
		{
			response.throw( 500,
				"Unable to save administrator.",
				error
			);                                                          // ==>
		}

		//
		// Store user in session.
		//
		request.session.uid = user._key;
		request.sessionStorage.save( request.session );

		response.send({ success: true});                                // ==>
	}
)
	.body(
		Admin,                                      // Admin parameter schema.
	)
	.response(
		[ 'application/json' ],						// Content type (may be omitted).
		Joi.boolean().required(),					// Validation: required boolean.
		"Operation result.'"			        	// Description.
	)
	.summary(
		"Create system administration user"
	)
	.description(
		"Will create the system administrator user if the users collection doesn't exist."
	);
