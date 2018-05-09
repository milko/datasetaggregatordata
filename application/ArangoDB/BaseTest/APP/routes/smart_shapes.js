'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_shape = require('../models/smart_shape');

const smart_shapes = module.context.collection('smart_shapes');
const keySchema = joi.string().required()
.description('The key of the smart_shape');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_shape');


router.get(function (req, res) {
  res.send(smart_shapes.all());
}, 'list')
.response([Smart_shape], 'A list of smart_shapes.')
.summary('List all smart_shapes')
.description(dd`
  Retrieves a list of all smart_shapes.
`);


router.post(function (req, res) {
  const smart_shape = req.body;
  let meta;
  try {
    meta = smart_shapes.save(smart_shape);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_shape, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_shape._key})
  ));
  res.send(smart_shape);
}, 'create')
.body(Smart_shape, 'The smart_shape to create.')
.response(201, Smart_shape, 'The created smart_shape.')
.error(HTTP_CONFLICT, 'The smart_shape already exists.')
.summary('Create a new smart_shape')
.description(dd`
  Creates a new smart_shape from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_shape
  try {
    smart_shape = smart_shapes.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_shape);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_shape, 'The smart_shape.')
.summary('Fetch a smart_shape')
.description(dd`
  Retrieves a smart_shape by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_shape = req.body;
  let meta;
  try {
    meta = smart_shapes.replace(key, smart_shape);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_shape, meta);
  res.send(smart_shape);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_shape, 'The data to replace the smart_shape with.')
.response(Smart_shape, 'The new smart_shape.')
.summary('Replace a smart_shape')
.description(dd`
  Replaces an existing smart_shape with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_shape;
  try {
    smart_shapes.update(key, patchData);
    smart_shape = smart_shapes.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_shape);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_shape with.'))
.response(Smart_shape, 'The updated smart_shape.')
.summary('Update a smart_shape')
.description(dd`
  Patches a smart_shape with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_shapes.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_shape')
.description(dd`
  Deletes a smart_shape from the database.
`);
