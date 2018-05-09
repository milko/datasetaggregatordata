'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_edge = require('../models/smart_edge');

const smart_edges = module.context.collection('smart_edges');
const keySchema = joi.string().required()
.description('The key of the smart_edge');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_edge');


const NewSmart_edge = Object.assign({}, Smart_edge, {
  schema: Object.assign({}, Smart_edge.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});


router.get(function (req, res) {
  res.send(smart_edges.all());
}, 'list')
.response([Smart_edge], 'A list of smart_edges.')
.summary('List all smart_edges')
.description(dd`
  Retrieves a list of all smart_edges.
`);


router.post(function (req, res) {
  const smart_edge = req.body;
  let meta;
  try {
    meta = smart_edges.save(smart_edge._from, smart_edge._to, smart_edge);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_edge, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_edge._key})
  ));
  res.send(smart_edge);
}, 'create')
.body(NewSmart_edge, 'The smart_edge to create.')
.response(201, Smart_edge, 'The created smart_edge.')
.error(HTTP_CONFLICT, 'The smart_edge already exists.')
.summary('Create a new smart_edge')
.description(dd`
  Creates a new smart_edge from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_edge
  try {
    smart_edge = smart_edges.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_edge);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_edge, 'The smart_edge.')
.summary('Fetch a smart_edge')
.description(dd`
  Retrieves a smart_edge by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_edge = req.body;
  let meta;
  try {
    meta = smart_edges.replace(key, smart_edge);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_edge, meta);
  res.send(smart_edge);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_edge, 'The data to replace the smart_edge with.')
.response(Smart_edge, 'The new smart_edge.')
.summary('Replace a smart_edge')
.description(dd`
  Replaces an existing smart_edge with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_edge;
  try {
    smart_edges.update(key, patchData);
    smart_edge = smart_edges.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_edge);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_edge with.'))
.response(Smart_edge, 'The updated smart_edge.')
.summary('Update a smart_edge')
.description(dd`
  Patches a smart_edge with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_edges.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_edge')
.description(dd`
  Deletes a smart_edge from the database.
`);
