'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Annex = require('../models/annex');

const annexes = module.context.collection('annexes');
const keySchema = joi.string().required()
.description('The key of the annex');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('annex');


router.get(function (req, res) {
  res.send(annexes.all());
}, 'list')
.response([Annex], 'A list of annexes.')
.summary('List all annexes')
.description(dd`
  Retrieves a list of all annexes.
`);


router.post(function (req, res) {
  const annex = req.body;
  let meta;
  try {
    meta = annexes.save(annex);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(annex, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: annex._key})
  ));
  res.send(annex);
}, 'create')
.body(Annex, 'The annex to create.')
.response(201, Annex, 'The created annex.')
.error(HTTP_CONFLICT, 'The annex already exists.')
.summary('Create a new annex')
.description(dd`
  Creates a new annex from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let annex
  try {
    annex = annexes.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(annex);
}, 'detail')
.pathParam('key', keySchema)
.response(Annex, 'The annex.')
.summary('Fetch a annex')
.description(dd`
  Retrieves a annex by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const annex = req.body;
  let meta;
  try {
    meta = annexes.replace(key, annex);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(annex, meta);
  res.send(annex);
}, 'replace')
.pathParam('key', keySchema)
.body(Annex, 'The data to replace the annex with.')
.response(Annex, 'The new annex.')
.summary('Replace a annex')
.description(dd`
  Replaces an existing annex with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let annex;
  try {
    annexes.update(key, patchData);
    annex = annexes.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(annex);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the annex with.'))
.response(Annex, 'The updated annex.')
.summary('Update a annex')
.description(dd`
  Patches a annex with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    annexes.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a annex')
.description(dd`
  Deletes a annex from the database.
`);
