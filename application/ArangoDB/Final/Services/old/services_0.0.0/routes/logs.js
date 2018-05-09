'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Log = require('../models/log');

const logs = module.context.collection('logs');
const keySchema = joi.string().required()
.description('The key of the log');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('log');


router.get(function (req, res) {
  res.send(logs.all());
}, 'list')
.response([Log], 'A list of logs.')
.summary('List all logs')
.description(dd`
  Retrieves a list of all logs.
`);


router.post(function (req, res) {
  const log = req.body;
  let meta;
  try {
    meta = logs.save(log);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(log, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: log._key})
  ));
  res.send(log);
}, 'create')
.body(Log, 'The log to create.')
.response(201, Log, 'The created log.')
.error(HTTP_CONFLICT, 'The log already exists.')
.summary('Create a new log')
.description(dd`
  Creates a new log from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let log
  try {
    log = logs.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(log);
}, 'detail')
.pathParam('key', keySchema)
.response(Log, 'The log.')
.summary('Fetch a log')
.description(dd`
  Retrieves a log by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const log = req.body;
  let meta;
  try {
    meta = logs.replace(key, log);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(log, meta);
  res.send(log);
}, 'replace')
.pathParam('key', keySchema)
.body(Log, 'The data to replace the log with.')
.response(Log, 'The new log.')
.summary('Replace a log')
.description(dd`
  Replaces an existing log with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let log;
  try {
    logs.update(key, patchData);
    log = logs.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(log);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the log with.'))
.response(Log, 'The updated log.')
.summary('Update a log')
.description(dd`
  Patches a log with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    logs.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a log')
.description(dd`
  Deletes a log from the database.
`);
