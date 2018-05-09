'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Link = require('../models/link');

const links = module.context.collection('links');
const keySchema = joi.string().required()
.description('The key of the link');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('link');


const NewLink = Object.assign({}, Link, {
  schema: Object.assign({}, Link.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});


router.get(function (req, res) {
  res.send(links.all());
}, 'list')
.response([Link], 'A list of links.')
.summary('List all links')
.description(dd`
  Retrieves a list of all links.
`);


router.post(function (req, res) {
  const link = req.body;
  let meta;
  try {
    meta = links.save(link._from, link._to, link);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(link, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: link._key})
  ));
  res.send(link);
}, 'create')
.body(NewLink, 'The link to create.')
.response(201, Link, 'The created link.')
.error(HTTP_CONFLICT, 'The link already exists.')
.summary('Create a new link')
.description(dd`
  Creates a new link from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let link
  try {
    link = links.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(link);
}, 'detail')
.pathParam('key', keySchema)
.response(Link, 'The link.')
.summary('Fetch a link')
.description(dd`
  Retrieves a link by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const link = req.body;
  let meta;
  try {
    meta = links.replace(key, link);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(link, meta);
  res.send(link);
}, 'replace')
.pathParam('key', keySchema)
.body(Link, 'The data to replace the link with.')
.response(Link, 'The new link.')
.summary('Replace a link')
.description(dd`
  Replaces an existing link with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let link;
  try {
    links.update(key, patchData);
    link = links.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(link);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the link with.'))
.response(Link, 'The updated link.')
.summary('Update a link')
.description(dd`
  Patches a link with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    links.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a link')
.description(dd`
  Deletes a link from the database.
`);
