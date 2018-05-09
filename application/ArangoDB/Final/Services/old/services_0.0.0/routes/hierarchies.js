'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Hierarchy = require('../models/hierarchy');

const hierarchies = module.context.collection('hierarchies');
const keySchema = joi.string().required()
.description('The key of the hierarchy');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('hierarchy');


const NewHierarchy = Object.assign({}, Hierarchy, {
  schema: Object.assign({}, Hierarchy.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});


router.get(function (req, res) {
  res.send(hierarchies.all());
}, 'list')
.response([Hierarchy], 'A list of hierarchies.')
.summary('List all hierarchies')
.description(dd`
  Retrieves a list of all hierarchies.
`);


router.post(function (req, res) {
  const hierarchy = req.body;
  let meta;
  try {
    meta = hierarchies.save(hierarchy._from, hierarchy._to, hierarchy);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(hierarchy, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: hierarchy._key})
  ));
  res.send(hierarchy);
}, 'create')
.body(NewHierarchy, 'The hierarchy to create.')
.response(201, Hierarchy, 'The created hierarchy.')
.error(HTTP_CONFLICT, 'The hierarchy already exists.')
.summary('Create a new hierarchy')
.description(dd`
  Creates a new hierarchy from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let hierarchy
  try {
    hierarchy = hierarchies.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(hierarchy);
}, 'detail')
.pathParam('key', keySchema)
.response(Hierarchy, 'The hierarchy.')
.summary('Fetch a hierarchy')
.description(dd`
  Retrieves a hierarchy by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const hierarchy = req.body;
  let meta;
  try {
    meta = hierarchies.replace(key, hierarchy);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(hierarchy, meta);
  res.send(hierarchy);
}, 'replace')
.pathParam('key', keySchema)
.body(Hierarchy, 'The data to replace the hierarchy with.')
.response(Hierarchy, 'The new hierarchy.')
.summary('Replace a hierarchy')
.description(dd`
  Replaces an existing hierarchy with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let hierarchy;
  try {
    hierarchies.update(key, patchData);
    hierarchy = hierarchies.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(hierarchy);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the hierarchy with.'))
.response(Hierarchy, 'The updated hierarchy.')
.summary('Update a hierarchy')
.description(dd`
  Patches a hierarchy with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    hierarchies.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a hierarchy')
.description(dd`
  Deletes a hierarchy from the database.
`);
