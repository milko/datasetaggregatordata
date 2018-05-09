'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_toponym = require('../models/smart_toponym');

const smart_toponyms = module.context.collection('smart_toponyms');
const keySchema = joi.string().required()
.description('The key of the smart_toponym');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_toponym');


router.get(function (req, res) {
  res.send(smart_toponyms.all());
}, 'list')
.response([Smart_toponym], 'A list of smart_toponyms.')
.summary('List all smart_toponyms')
.description(dd`
  Retrieves a list of all smart_toponyms.
`);


router.post(function (req, res) {
  const smart_toponym = req.body;
  let meta;
  try {
    meta = smart_toponyms.save(smart_toponym);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_toponym, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_toponym._key})
  ));
  res.send(smart_toponym);
}, 'create')
.body(Smart_toponym, 'The smart_toponym to create.')
.response(201, Smart_toponym, 'The created smart_toponym.')
.error(HTTP_CONFLICT, 'The smart_toponym already exists.')
.summary('Create a new smart_toponym')
.description(dd`
  Creates a new smart_toponym from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_toponym
  try {
    smart_toponym = smart_toponyms.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_toponym);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_toponym, 'The smart_toponym.')
.summary('Fetch a smart_toponym')
.description(dd`
  Retrieves a smart_toponym by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_toponym = req.body;
  let meta;
  try {
    meta = smart_toponyms.replace(key, smart_toponym);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_toponym, meta);
  res.send(smart_toponym);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_toponym, 'The data to replace the smart_toponym with.')
.response(Smart_toponym, 'The new smart_toponym.')
.summary('Replace a smart_toponym')
.description(dd`
  Replaces an existing smart_toponym with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_toponym;
  try {
    smart_toponyms.update(key, patchData);
    smart_toponym = smart_toponyms.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_toponym);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_toponym with.'))
.response(Smart_toponym, 'The updated smart_toponym.')
.summary('Update a smart_toponym')
.description(dd`
  Patches a smart_toponym with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_toponyms.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_toponym')
.description(dd`
  Deletes a smart_toponym from the database.
`);
