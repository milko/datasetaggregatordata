'use strict';

module.exports = {

	mid1: (req, res, next) => {
		let error = false;

		if(! req.hasOwnProperty( 'test' ) )
			req.test = [];
		req.test.push("Passed in mod 1.");

		next(error);
	},

	mid2: (req, res, next) => {
		let error = false;

		if(! req.hasOwnProperty( 'test' ) )
			req.test = [];
		req.test.push("Passed in mod 2.");

		next(error);
	},

	mid3: (req, res, next) => {
		let error = false;

		if(! req.hasOwnProperty( 'test' ) )
			req.test = [];
		req.test.push("Passed in mod 3.");

		next(error);
	},

	handler: (req,res) => {
		if(! req.hasOwnProperty( 'test' ) )
			req.test = [];
		req.test.push("Passed in handler.");

		res.send({ result: req.test });
	}
};
