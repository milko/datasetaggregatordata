'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_group = require('../models/smart_group');

const smart_groups = module.context.collection('smart_groups');
const keySchema = joi.string().required()
.description('The key of the smart_group');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_group');


router.get(function (req, res) {
  res.send(smart_groups.all());
}, 'list')
.response([Smart_group], 'A list of smart_groups.')
.summary('List all smart_groups')
.description(dd`
  Retrieves a list of all smart_groups.
`);


router.post(function (req, res) {
  const smart_group = req.body;
  let meta;
  try {
    meta = smart_groups.save(smart_group);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_group, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_group._key})
  ));
  res.send(smart_group);
}, 'create')
.body(Smart_group, 'The smart_group to create.')
.response(201, Smart_group, 'The created smart_group.')
.error(HTTP_CONFLICT, 'The smart_group already exists.')
.summary('Create a new smart_group')
.description(dd`
  Creates a new smart_group from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_group
  try {
    smart_group = smart_groups.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_group);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_group, 'The smart_group.')
.summary('Fetch a smart_group')
.description(dd`
  Retrieves a smart_group by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_group = req.body;
  let meta;
  try {
    meta = smart_groups.replace(key, smart_group);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_group, meta);
  res.send(smart_group);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_group, 'The data to replace the smart_group with.')
.response(Smart_group, 'The new smart_group.')
.summary('Replace a smart_group')
.description(dd`
  Replaces an existing smart_group with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_group;
  try {
    smart_groups.update(key, patchData);
    smart_group = smart_groups.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_group);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_group with.'))
.response(Smart_group, 'The updated smart_group.')
.summary('Update a smart_group')
.description(dd`
  Patches a smart_group with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_groups.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_group')
.description(dd`
  Deletes a smart_group from the database.
`);
