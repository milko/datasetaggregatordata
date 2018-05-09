'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_log = require('../models/smart_log');

const smart_logs = module.context.collection('smart_logs');
const keySchema = joi.string().required()
.description('The key of the smart_log');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_log');


router.get(function (req, res) {
  res.send(smart_logs.all());
}, 'list')
.response([Smart_log], 'A list of smart_logs.')
.summary('List all smart_logs')
.description(dd`
  Retrieves a list of all smart_logs.
`);


router.post(function (req, res) {
  const smart_log = req.body;
  let meta;
  try {
    meta = smart_logs.save(smart_log);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_log, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_log._key})
  ));
  res.send(smart_log);
}, 'create')
.body(Smart_log, 'The smart_log to create.')
.response(201, Smart_log, 'The created smart_log.')
.error(HTTP_CONFLICT, 'The smart_log already exists.')
.summary('Create a new smart_log')
.description(dd`
  Creates a new smart_log from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_log
  try {
    smart_log = smart_logs.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_log);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_log, 'The smart_log.')
.summary('Fetch a smart_log')
.description(dd`
  Retrieves a smart_log by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_log = req.body;
  let meta;
  try {
    meta = smart_logs.replace(key, smart_log);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_log, meta);
  res.send(smart_log);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_log, 'The data to replace the smart_log with.')
.response(Smart_log, 'The new smart_log.')
.summary('Replace a smart_log')
.description(dd`
  Replaces an existing smart_log with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_log;
  try {
    smart_logs.update(key, patchData);
    smart_log = smart_logs.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_log);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_log with.'))
.response(Smart_log, 'The updated smart_log.')
.summary('Update a smart_log')
.description(dd`
  Patches a smart_log with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_logs.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_log')
.description(dd`
  Deletes a smart_log from the database.
`);
