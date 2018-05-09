'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Toponym = require('../models/toponym');

const toponyms = module.context.collection('toponyms');
const keySchema = joi.string().required()
.description('The key of the toponym');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('toponym');


router.get(function (req, res) {
  res.send(toponyms.all());
}, 'list')
.response([Toponym], 'A list of toponyms.')
.summary('List all toponyms')
.description(dd`
  Retrieves a list of all toponyms.
`);


router.post(function (req, res) {
  const toponym = req.body;
  let meta;
  try {
    meta = toponyms.save(toponym);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(toponym, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: toponym._key})
  ));
  res.send(toponym);
}, 'create')
.body(Toponym, 'The toponym to create.')
.response(201, Toponym, 'The created toponym.')
.error(HTTP_CONFLICT, 'The toponym already exists.')
.summary('Create a new toponym')
.description(dd`
  Creates a new toponym from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let toponym
  try {
    toponym = toponyms.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(toponym);
}, 'detail')
.pathParam('key', keySchema)
.response(Toponym, 'The toponym.')
.summary('Fetch a toponym')
.description(dd`
  Retrieves a toponym by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const toponym = req.body;
  let meta;
  try {
    meta = toponyms.replace(key, toponym);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(toponym, meta);
  res.send(toponym);
}, 'replace')
.pathParam('key', keySchema)
.body(Toponym, 'The data to replace the toponym with.')
.response(Toponym, 'The new toponym.')
.summary('Replace a toponym')
.description(dd`
  Replaces an existing toponym with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let toponym;
  try {
    toponyms.update(key, patchData);
    toponym = toponyms.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(toponym);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the toponym with.'))
.response(Toponym, 'The updated toponym.')
.summary('Update a toponym')
.description(dd`
  Patches a toponym with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    toponyms.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a toponym')
.description(dd`
  Deletes a toponym from the database.
`);
