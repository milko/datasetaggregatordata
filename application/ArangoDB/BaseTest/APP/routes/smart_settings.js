'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_setting = require('../models/smart_setting');

const smart_settings = module.context.collection('smart_settings');
const keySchema = joi.string().required()
.description('The key of the smart_setting');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_setting');


router.get(function (req, res) {
  res.send(smart_settings.all());
}, 'list')
.response([Smart_setting], 'A list of smart_settings.')
.summary('List all smart_settings')
.description(dd`
  Retrieves a list of all smart_settings.
`);


router.post(function (req, res) {
  const smart_setting = req.body;
  let meta;
  try {
    meta = smart_settings.save(smart_setting);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_setting, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_setting._key})
  ));
  res.send(smart_setting);
}, 'create')
.body(Smart_setting, 'The smart_setting to create.')
.response(201, Smart_setting, 'The created smart_setting.')
.error(HTTP_CONFLICT, 'The smart_setting already exists.')
.summary('Create a new smart_setting')
.description(dd`
  Creates a new smart_setting from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_setting
  try {
    smart_setting = smart_settings.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_setting);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_setting, 'The smart_setting.')
.summary('Fetch a smart_setting')
.description(dd`
  Retrieves a smart_setting by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_setting = req.body;
  let meta;
  try {
    meta = smart_settings.replace(key, smart_setting);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_setting, meta);
  res.send(smart_setting);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_setting, 'The data to replace the smart_setting with.')
.response(Smart_setting, 'The new smart_setting.')
.summary('Replace a smart_setting')
.description(dd`
  Replaces an existing smart_setting with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_setting;
  try {
    smart_settings.update(key, patchData);
    smart_setting = smart_settings.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_setting);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_setting with.'))
.response(Smart_setting, 'The updated smart_setting.')
.summary('Update a smart_setting')
.description(dd`
  Patches a smart_setting with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_settings.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_setting')
.description(dd`
  Deletes a smart_setting from the database.
`);
