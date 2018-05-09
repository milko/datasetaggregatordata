'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_descriptor = require('../models/smart_descriptor');

const smart_descriptors = module.context.collection('smart_descriptors');
const keySchema = joi.string().required()
.description('The key of the smart_descriptor');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_descriptor');


router.get(function (req, res) {
  res.send(smart_descriptors.all());
}, 'list')
.response([Smart_descriptor], 'A list of smart_descriptors.')
.summary('List all smart_descriptors')
.description(dd`
  Retrieves a list of all smart_descriptors.
`);


router.post(function (req, res) {
  const smart_descriptor = req.body;
  let meta;
  try {
    meta = smart_descriptors.save(smart_descriptor);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_descriptor, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_descriptor._key})
  ));
  res.send(smart_descriptor);
}, 'create')
.body(Smart_descriptor, 'The smart_descriptor to create.')
.response(201, Smart_descriptor, 'The created smart_descriptor.')
.error(HTTP_CONFLICT, 'The smart_descriptor already exists.')
.summary('Create a new smart_descriptor')
.description(dd`
  Creates a new smart_descriptor from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_descriptor
  try {
    smart_descriptor = smart_descriptors.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_descriptor);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_descriptor, 'The smart_descriptor.')
.summary('Fetch a smart_descriptor')
.description(dd`
  Retrieves a smart_descriptor by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_descriptor = req.body;
  let meta;
  try {
    meta = smart_descriptors.replace(key, smart_descriptor);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_descriptor, meta);
  res.send(smart_descriptor);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_descriptor, 'The data to replace the smart_descriptor with.')
.response(Smart_descriptor, 'The new smart_descriptor.')
.summary('Replace a smart_descriptor')
.description(dd`
  Replaces an existing smart_descriptor with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_descriptor;
  try {
    smart_descriptors.update(key, patchData);
    smart_descriptor = smart_descriptors.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_descriptor);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_descriptor with.'))
.response(Smart_descriptor, 'The updated smart_descriptor.')
.summary('Update a smart_descriptor')
.description(dd`
  Patches a smart_descriptor with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_descriptors.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_descriptor')
.description(dd`
  Deletes a smart_descriptor from the database.
`);
