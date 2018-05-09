'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_user = require('../models/smart_user');

const smart_users = module.context.collection('smart_users');
const keySchema = joi.string().required()
.description('The key of the smart_user');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_user');


router.get(function (req, res) {
  res.send(smart_users.all());
}, 'list')
.response([Smart_user], 'A list of smart_users.')
.summary('List all smart_users')
.description(dd`
  Retrieves a list of all smart_users.
`);


router.post(function (req, res) {
  const smart_user = req.body;
  let meta;
  try {
    meta = smart_users.save(smart_user);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_user, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_user._key})
  ));
  res.send(smart_user);
}, 'create')
.body(Smart_user, 'The smart_user to create.')
.response(201, Smart_user, 'The created smart_user.')
.error(HTTP_CONFLICT, 'The smart_user already exists.')
.summary('Create a new smart_user')
.description(dd`
  Creates a new smart_user from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_user
  try {
    smart_user = smart_users.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_user);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_user, 'The smart_user.')
.summary('Fetch a smart_user')
.description(dd`
  Retrieves a smart_user by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_user = req.body;
  let meta;
  try {
    meta = smart_users.replace(key, smart_user);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_user, meta);
  res.send(smart_user);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_user, 'The data to replace the smart_user with.')
.response(Smart_user, 'The new smart_user.')
.summary('Replace a smart_user')
.description(dd`
  Replaces an existing smart_user with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_user;
  try {
    smart_users.update(key, patchData);
    smart_user = smart_users.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_user);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_user with.'))
.response(Smart_user, 'The updated smart_user.')
.summary('Update a smart_user')
.description(dd`
  Patches a smart_user with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_users.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_user')
.description(dd`
  Deletes a smart_user from the database.
`);
