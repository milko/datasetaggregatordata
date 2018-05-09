'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Study = require('../models/study');

const studies = module.context.collection('studies');
const keySchema = joi.string().required()
.description('The key of the study');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('study');


router.get(function (req, res) {
  res.send(studies.all());
}, 'list')
.response([Study], 'A list of studies.')
.summary('List all studies')
.description(dd`
  Retrieves a list of all studies.
`);


router.post(function (req, res) {
  const study = req.body;
  let meta;
  try {
    meta = studies.save(study);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(study, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: study._key})
  ));
  res.send(study);
}, 'create')
.body(Study, 'The study to create.')
.response(201, Study, 'The created study.')
.error(HTTP_CONFLICT, 'The study already exists.')
.summary('Create a new study')
.description(dd`
  Creates a new study from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let study
  try {
    study = studies.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(study);
}, 'detail')
.pathParam('key', keySchema)
.response(Study, 'The study.')
.summary('Fetch a study')
.description(dd`
  Retrieves a study by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const study = req.body;
  let meta;
  try {
    meta = studies.replace(key, study);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(study, meta);
  res.send(study);
}, 'replace')
.pathParam('key', keySchema)
.body(Study, 'The data to replace the study with.')
.response(Study, 'The new study.')
.summary('Replace a study')
.description(dd`
  Replaces an existing study with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let study;
  try {
    studies.update(key, patchData);
    study = studies.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(study);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the study with.'))
.response(Study, 'The updated study.')
.summary('Update a study')
.description(dd`
  Patches a study with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    studies.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a study')
.description(dd`
  Deletes a study from the database.
`);
