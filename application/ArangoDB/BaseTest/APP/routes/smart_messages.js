'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Smart_message = require('../models/smart_message');

const smart_messages = module.context.collection('smart_messages');
const keySchema = joi.string().required()
.description('The key of the smart_message');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('smart_message');


router.get(function (req, res) {
  res.send(smart_messages.all());
}, 'list')
.response([Smart_message], 'A list of smart_messages.')
.summary('List all smart_messages')
.description(dd`
  Retrieves a list of all smart_messages.
`);


router.post(function (req, res) {
  const smart_message = req.body;
  let meta;
  try {
    meta = smart_messages.save(smart_message);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_message, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: smart_message._key})
  ));
  res.send(smart_message);
}, 'create')
.body(Smart_message, 'The smart_message to create.')
.response(201, Smart_message, 'The created smart_message.')
.error(HTTP_CONFLICT, 'The smart_message already exists.')
.summary('Create a new smart_message')
.description(dd`
  Creates a new smart_message from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let smart_message
  try {
    smart_message = smart_messages.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(smart_message);
}, 'detail')
.pathParam('key', keySchema)
.response(Smart_message, 'The smart_message.')
.summary('Fetch a smart_message')
.description(dd`
  Retrieves a smart_message by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const smart_message = req.body;
  let meta;
  try {
    meta = smart_messages.replace(key, smart_message);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(smart_message, meta);
  res.send(smart_message);
}, 'replace')
.pathParam('key', keySchema)
.body(Smart_message, 'The data to replace the smart_message with.')
.response(Smart_message, 'The new smart_message.')
.summary('Replace a smart_message')
.description(dd`
  Replaces an existing smart_message with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let smart_message;
  try {
    smart_messages.update(key, patchData);
    smart_message = smart_messages.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(smart_message);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the smart_message with.'))
.response(Smart_message, 'The updated smart_message.')
.summary('Update a smart_message')
.description(dd`
  Patches a smart_message with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    smart_messages.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a smart_message')
.description(dd`
  Deletes a smart_message from the database.
`);
