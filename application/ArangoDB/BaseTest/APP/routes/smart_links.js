'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_link = require('../models/smart_link');

const smart_links = module.context.collection('smart_links');
const keySchema = joi.string().required()
.description('The key of the smart_link');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_link');


const NewSmart_link = Object.assign({}, Smart_link, {
  schema: Object.assign({}, Smart_link.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});


router.get(function (req, res) {
  res.send(smart_links.all());
}, 'list')
.response([Smart_link], 'A list of smart_links.')
.summary('List all smart_links')
.description(dd`
  Retrieves a list of all smart_links.
`);


router.post(function (req, res) {
  const smart_link = req.body;
  let meta;
  try {
    meta = smart_links.save(smart_link._from, smart_link._to, smart_link);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_link, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_link._key})
  ));
  res.send(smart_link);
}, 'create')
.body(NewSmart_link, 'The smart_link to create.')
.response(201, Smart_link, 'The created smart_link.')
.error(HTTP_CONFLICT, 'The smart_link already exists.')
.summary('Create a new smart_link')
.description(dd`
  Creates a new smart_link from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_link
  try {
    smart_link = smart_links.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_link);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_link, 'The smart_link.')
.summary('Fetch a smart_link')
.description(dd`
  Retrieves a smart_link by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_link = req.body;
  let meta;
  try {
    meta = smart_links.replace(key, smart_link);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_link, meta);
  res.send(smart_link);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_link, 'The data to replace the smart_link with.')
.response(Smart_link, 'The new smart_link.')
.summary('Replace a smart_link')
.description(dd`
  Replaces an existing smart_link with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_link;
  try {
    smart_links.update(key, patchData);
    smart_link = smart_links.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_link);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_link with.'))
.response(Smart_link, 'The updated smart_link.')
.summary('Update a smart_link')
.description(dd`
  Patches a smart_link with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_links.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_link')
.description(dd`
  Deletes a smart_link from the database.
`);
