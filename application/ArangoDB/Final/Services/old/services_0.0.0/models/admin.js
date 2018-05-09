'use strict';

const _ = require('lodash');
const Joi = require('joi');
const User = require( '../utils/User' );

const user = {};
user[ User.field.name ] = Joi.string().required();
user[ User.param.pass ] = Joi.string().required();
user[ User.field.email ] = Joi.string().email().required();
user[ User.field.lang ] = Joi.string().required();

const schema = {};
schema[ User.param.token ] = Joi.string().required();
schema[ User.param.user ] = Joi.object( user ).required();

module.exports = {
	schema: schema,

	forClient(obj) {
		// Implement outgoing transformations here
		obj = _.omit(obj, ['_id', '_rev', '_oldRev']);
		return obj;
	},

	fromClient(obj) {
		// Implement incoming transformations here
		return obj;
	}
};
