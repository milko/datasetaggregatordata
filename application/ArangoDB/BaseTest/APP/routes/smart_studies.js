'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_study = require('../models/smart_study');

const smart_studies = module.context.collection('smart_studies');
const keySchema = joi.string().required()
.description('The key of the smart_study');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_study');


router.get(function (req, res) {
  res.send(smart_studies.all());
}, 'list')
.response([Smart_study], 'A list of smart_studies.')
.summary('List all smart_studies')
.description(dd`
  Retrieves a list of all smart_studies.
`);


router.post(function (req, res) {
  const smart_study = req.body;
  let meta;
  try {
    meta = smart_studies.save(smart_study);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_study, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_study._key})
  ));
  res.send(smart_study);
}, 'create')
.body(Smart_study, 'The smart_study to create.')
.response(201, Smart_study, 'The created smart_study.')
.error(HTTP_CONFLICT, 'The smart_study already exists.')
.summary('Create a new smart_study')
.description(dd`
  Creates a new smart_study from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_study
  try {
    smart_study = smart_studies.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_study);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_study, 'The smart_study.')
.summary('Fetch a smart_study')
.description(dd`
  Retrieves a smart_study by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_study = req.body;
  let meta;
  try {
    meta = smart_studies.replace(key, smart_study);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_study, meta);
  res.send(smart_study);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_study, 'The data to replace the smart_study with.')
.response(Smart_study, 'The new smart_study.')
.summary('Replace a smart_study')
.description(dd`
  Replaces an existing smart_study with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_study;
  try {
    smart_studies.update(key, patchData);
    smart_study = smart_studies.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_study);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_study with.'))
.response(Smart_study, 'The updated smart_study.')
.summary('Update a smart_study')
.description(dd`
  Patches a smart_study with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_studies.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_study')
.description(dd`
  Deletes a smart_study from the database.
`);
