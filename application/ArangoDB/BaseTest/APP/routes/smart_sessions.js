'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_session = require('../models/smart_session');

const smart_sessions = module.context.collection('smart_sessions');
const keySchema = joi.string().required()
.description('The key of the smart_session');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_session');


router.get(function (req, res) {
  res.send(smart_sessions.all());
}, 'list')
.response([Smart_session], 'A list of smart_sessions.')
.summary('List all smart_sessions')
.description(dd`
  Retrieves a list of all smart_sessions.
`);


router.post(function (req, res) {
  const smart_session = req.body;
  let meta;
  try {
    meta = smart_sessions.save(smart_session);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_session, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_session._key})
  ));
  res.send(smart_session);
}, 'create')
.body(Smart_session, 'The smart_session to create.')
.response(201, Smart_session, 'The created smart_session.')
.error(HTTP_CONFLICT, 'The smart_session already exists.')
.summary('Create a new smart_session')
.description(dd`
  Creates a new smart_session from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_session
  try {
    smart_session = smart_sessions.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_session);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_session, 'The smart_session.')
.summary('Fetch a smart_session')
.description(dd`
  Retrieves a smart_session by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_session = req.body;
  let meta;
  try {
    meta = smart_sessions.replace(key, smart_session);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_session, meta);
  res.send(smart_session);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_session, 'The data to replace the smart_session with.')
.response(Smart_session, 'The new smart_session.')
.summary('Replace a smart_session')
.description(dd`
  Replaces an existing smart_session with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_session;
  try {
    smart_sessions.update(key, patchData);
    smart_session = smart_sessions.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_session);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_session with.'))
.response(Smart_session, 'The updated smart_session.')
.summary('Update a smart_session')
.description(dd`
  Patches a smart_session with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_sessions.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_session')
.description(dd`
  Deletes a smart_session from the database.
`);
