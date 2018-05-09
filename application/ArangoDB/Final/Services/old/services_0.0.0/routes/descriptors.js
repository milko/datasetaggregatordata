'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Descriptor = require('../models/descriptor');

const descriptors = module.context.collection('descriptors');
const keySchema = joi.string().required()
.description('The key of the descriptor');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('descriptor');


router.get(function (req, res) {
  res.send(descriptors.all());
}, 'list')
.response([Descriptor], 'A list of descriptors.')
.summary('List all descriptors')
.description(dd`
  Retrieves a list of all descriptors.
`);


router.post(function (req, res) {
  const descriptor = req.body;
  let meta;
  try {
    meta = descriptors.save(descriptor);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(descriptor, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: descriptor._key})
  ));
  res.send(descriptor);
}, 'create')
.body(Descriptor, 'The descriptor to create.')
.response(201, Descriptor, 'The created descriptor.')
.error(HTTP_CONFLICT, 'The descriptor already exists.')
.summary('Create a new descriptor')
.description(dd`
  Creates a new descriptor from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let descriptor
  try {
    descriptor = descriptors.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(descriptor);
}, 'detail')
.pathParam('key', keySchema)
.response(Descriptor, 'The descriptor.')
.summary('Fetch a descriptor')
.description(dd`
  Retrieves a descriptor by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const descriptor = req.body;
  let meta;
  try {
    meta = descriptors.replace(key, descriptor);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(descriptor, meta);
  res.send(descriptor);
}, 'replace')
.pathParam('key', keySchema)
.body(Descriptor, 'The data to replace the descriptor with.')
.response(Descriptor, 'The new descriptor.')
.summary('Replace a descriptor')
.description(dd`
  Replaces an existing descriptor with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let descriptor;
  try {
    descriptors.update(key, patchData);
    descriptor = descriptors.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(descriptor);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the descriptor with.'))
.response(Descriptor, 'The updated descriptor.')
.summary('Update a descriptor')
.description(dd`
  Patches a descriptor with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    descriptors.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a descriptor')
.description(dd`
  Deletes a descriptor from the database.
`);
