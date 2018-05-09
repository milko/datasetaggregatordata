'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_smart = require('../models/smart_smart');

const smart_smartItems = module.context.collection('smart_smart');
const keySchema = joi.string().required()
.description('The key of the smart_smart');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_smart');


router.get(function (req, res) {
  res.send(smart_smartItems.all());
}, 'list')
.response([Smart_smart], 'A list of smart_smartItems.')
.summary('List all smart_smartItems')
.description(dd`
  Retrieves a list of all smart_smartItems.
`);


router.post(function (req, res) {
  const smart_smart = req.body;
  let meta;
  try {
    meta = smart_smartItems.save(smart_smart);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_smart, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_smart._key})
  ));
  res.send(smart_smart);
}, 'create')
.body(Smart_smart, 'The smart_smart to create.')
.response(201, Smart_smart, 'The created smart_smart.')
.error(HTTP_CONFLICT, 'The smart_smart already exists.')
.summary('Create a new smart_smart')
.description(dd`
  Creates a new smart_smart from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_smart
  try {
    smart_smart = smart_smartItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_smart);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_smart, 'The smart_smart.')
.summary('Fetch a smart_smart')
.description(dd`
  Retrieves a smart_smart by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_smart = req.body;
  let meta;
  try {
    meta = smart_smartItems.replace(key, smart_smart);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_smart, meta);
  res.send(smart_smart);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_smart, 'The data to replace the smart_smart with.')
.response(Smart_smart, 'The new smart_smart.')
.summary('Replace a smart_smart')
.description(dd`
  Replaces an existing smart_smart with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_smart;
  try {
    smart_smartItems.update(key, patchData);
    smart_smart = smart_smartItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_smart);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_smart with.'))
.response(Smart_smart, 'The updated smart_smart.')
.summary('Update a smart_smart')
.description(dd`
  Patches a smart_smart with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_smartItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_smart')
.description(dd`
  Deletes a smart_smart from the database.
`);
