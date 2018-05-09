'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_annex = require('../models/smart_annex');

const smart_annexes = module.context.collection('smart_annexes');
const keySchema = joi.string().required().description('The key of the smart_annex');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_annex');


router.get(function (req, res) {
  res.send(smart_annexes.all());
}, 'list')
.response([Smart_annex], 'A list of smart_annexes.')
.summary('List all smart_annexes')
.description(dd`
  Retrieves a list of all smart_annexes.
`);


router.post(function (req, res) {
  const smart_annex = req.body;
  let meta;
  try {
    meta = smart_annexes.save(smart_annex);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_annex, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_annex._key})
  ));
  res.send(smart_annex);
}, 'create')
.body(Smart_annex, 'The smart_annex to create.')
.response(201, Smart_annex, 'The created smart_annex.')
.error(HTTP_CONFLICT, 'The smart_annex already exists.')
.summary('Create a new smart_annex')
.description(dd`
  Creates a new smart_annex from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_annex
  try {
    smart_annex = smart_annexes.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_annex);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_annex, 'The smart_annex.')
.summary('Fetch a smart_annex')
.description(dd`
  Retrieves a smart_annex by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_annex = req.body;
  let meta;
  try {
    meta = smart_annexes.replace(key, smart_annex);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_annex, meta);
  res.send(smart_annex);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_annex, 'The data to replace the smart_annex with.')
.response(Smart_annex, 'The new smart_annex.')
.summary('Replace a smart_annex')
.description(dd`
  Replaces an existing smart_annex with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_annex;
  try {
    smart_annexes.update(key, patchData);
    smart_annex = smart_annexes.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_annex);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_annex with.'))
.response(Smart_annex, 'The updated smart_annex.')
.summary('Update a smart_annex')
.description(dd`
  Patches a smart_annex with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_annexes.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_annex')
.description(dd`
  Deletes a smart_annex from the database.
`);
