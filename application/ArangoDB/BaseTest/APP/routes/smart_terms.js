'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_term = require('../models/smart_term');

const smart_terms = module.context.collection('smart_terms');
const keySchema = joi.string().required()
.description('The key of the smart_term');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_term');


router.get(function (req, res) {
  res.send(smart_terms.all());
}, 'list')
.response([Smart_term], 'A list of smart_terms.')
.summary('List all smart_terms')
.description(dd`
  Retrieves a list of all smart_terms.
`);


router.post(function (req, res) {
  const smart_term = req.body;
  let meta;
  try {
    meta = smart_terms.save(smart_term);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_term, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_term._key})
  ));
  res.send(smart_term);
}, 'create')
.body(Smart_term, 'The smart_term to create.')
.response(201, Smart_term, 'The created smart_term.')
.error(HTTP_CONFLICT, 'The smart_term already exists.')
.summary('Create a new smart_term')
.description(dd`
  Creates a new smart_term from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_term
  try {
    smart_term = smart_terms.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_term);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_term, 'The smart_term.')
.summary('Fetch a smart_term')
.description(dd`
  Retrieves a smart_term by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_term = req.body;
  let meta;
  try {
    meta = smart_terms.replace(key, smart_term);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_term, meta);
  res.send(smart_term);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_term, 'The data to replace the smart_term with.')
.response(Smart_term, 'The new smart_term.')
.summary('Replace a smart_term')
.description(dd`
  Replaces an existing smart_term with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_term;
  try {
    smart_terms.update(key, patchData);
    smart_term = smart_terms.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_term);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_term with.'))
.response(Smart_term, 'The updated smart_term.')
.summary('Update a smart_term')
.description(dd`
  Patches a smart_term with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_terms.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_term')
.description(dd`
  Deletes a smart_term from the database.
`);
