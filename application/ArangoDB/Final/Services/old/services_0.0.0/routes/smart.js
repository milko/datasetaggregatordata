'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart = require('../models/smart');

const smartItems = module.context.collection('smart');
const keySchema = joi.string().required()
.description('The key of the smart');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart');


router.get(function (req, res) {
  res.send(smartItems.all());
}, 'list')
.response([Smart], 'A list of smartItems.')
.summary('List all smartItems')
.description(dd`
  Retrieves a list of all smartItems.
`);


router.post(function (req, res) {
  const smart = req.body;
  let meta;
  try {
    meta = smartItems.save(smart);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart._key})
  ));
  res.send(smart);
}, 'create')
.body(Smart, 'The smart to create.')
.response(201, Smart, 'The created smart.')
.error(HTTP_CONFLICT, 'The smart already exists.')
.summary('Create a new smart')
.description(dd`
  Creates a new smart from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart
  try {
    smart = smartItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart, 'The smart.')
.summary('Fetch a smart')
.description(dd`
  Retrieves a smart by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart = req.body;
  let meta;
  try {
    meta = smartItems.replace(key, smart);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart, meta);
  res.send(smart);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart, 'The data to replace the smart with.')
.response(Smart, 'The new smart.')
.summary('Replace a smart')
.description(dd`
  Replaces an existing smart with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart;
  try {
    smartItems.update(key, patchData);
    smart = smartItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart with.'))
.response(Smart, 'The updated smart.')
.summary('Update a smart')
.description(dd`
  Patches a smart with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smartItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart')
.description(dd`
  Deletes a smart from the database.
`);
