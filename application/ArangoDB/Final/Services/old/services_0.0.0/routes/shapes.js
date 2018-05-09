'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Shape = require('../models/shape');

const shapes = module.context.collection('shapes');
const keySchema = joi.string().required()
.description('The key of the shape');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('shape');


router.get(function (req, res) {
  res.send(shapes.all());
}, 'list')
.response([Shape], 'A list of shapes.')
.summary('List all shapes')
.description(dd`
  Retrieves a list of all shapes.
`);


router.post(function (req, res) {
  const shape = req.body;
  let meta;
  try {
    meta = shapes.save(shape);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(shape, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: shape._key})
  ));
  res.send(shape);
}, 'create')
.body(Shape, 'The shape to create.')
.response(201, Shape, 'The created shape.')
.error(HTTP_CONFLICT, 'The shape already exists.')
.summary('Create a new shape')
.description(dd`
  Creates a new shape from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let shape
  try {
    shape = shapes.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(shape);
}, 'detail')
.pathParam('key', keySchema)
.response(Shape, 'The shape.')
.summary('Fetch a shape')
.description(dd`
  Retrieves a shape by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const shape = req.body;
  let meta;
  try {
    meta = shapes.replace(key, shape);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(shape, meta);
  res.send(shape);
}, 'replace')
.pathParam('key', keySchema)
.body(Shape, 'The data to replace the shape with.')
.response(Shape, 'The new shape.')
.summary('Replace a shape')
.description(dd`
  Replaces an existing shape with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let shape;
  try {
    shapes.update(key, patchData);
    shape = shapes.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(shape);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the shape with.'))
.response(Shape, 'The updated shape.')
.summary('Update a shape')
.description(dd`
  Patches a shape with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    shapes.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a shape')
.description(dd`
  Deletes a shape from the database.
`);
