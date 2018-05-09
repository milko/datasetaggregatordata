'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_schema = require('../models/smart_schema');

const smart_schemas = module.context.collection('smart_schemas');
const keySchema = joi.string().required()
.description('The key of the smart_schema');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_schema');


const NewSmart_schema = Object.assign({}, Smart_schema, {
  schema: Object.assign({}, Smart_schema.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});


router.get(function (req, res) {
  res.send(smart_schemas.all());
}, 'list')
.response([Smart_schema], 'A list of smart_schemas.')
.summary('List all smart_schemas')
.description(dd`
  Retrieves a list of all smart_schemas.
`);


router.post(function (req, res) {
  const smart_schema = req.body;
  let meta;
  try {
    meta = smart_schemas.save(smart_schema._from, smart_schema._to, smart_schema);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_schema, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_schema._key})
  ));
  res.send(smart_schema);
}, 'create')
.body(NewSmart_schema, 'The smart_schema to create.')
.response(201, Smart_schema, 'The created smart_schema.')
.error(HTTP_CONFLICT, 'The smart_schema already exists.')
.summary('Create a new smart_schema')
.description(dd`
  Creates a new smart_schema from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_schema
  try {
    smart_schema = smart_schemas.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_schema);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_schema, 'The smart_schema.')
.summary('Fetch a smart_schema')
.description(dd`
  Retrieves a smart_schema by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_schema = req.body;
  let meta;
  try {
    meta = smart_schemas.replace(key, smart_schema);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_schema, meta);
  res.send(smart_schema);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_schema, 'The data to replace the smart_schema with.')
.response(Smart_schema, 'The new smart_schema.')
.summary('Replace a smart_schema')
.description(dd`
  Replaces an existing smart_schema with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_schema;
  try {
    smart_schemas.update(key, patchData);
    smart_schema = smart_schemas.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_schema);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_schema with.'))
.response(Smart_schema, 'The updated smart_schema.')
.summary('Update a smart_schema')
.description(dd`
  Patches a smart_schema with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_schemas.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_schema')
.description(dd`
  Deletes a smart_schema from the database.
`);
