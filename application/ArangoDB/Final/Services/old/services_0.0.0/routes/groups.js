'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Group = require('../models/group');

const groups = module.context.collection('groups');
const keySchema = joi.string().required()
.description('The key of the group');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('group');


router.get(function (req, res) {
  res.send(groups.all());
}, 'list')
.response([Group], 'A list of groups.')
.summary('List all groups')
.description(dd`
  Retrieves a list of all groups.
`);


router.post(function (req, res) {
  const group = req.body;
  let meta;
  try {
    meta = groups.save(group);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(group, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: group._key})
  ));
  res.send(group);
}, 'create')
.body(Group, 'The group to create.')
.response(201, Group, 'The created group.')
.error(HTTP_CONFLICT, 'The group already exists.')
.summary('Create a new group')
.description(dd`
  Creates a new group from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let group
  try {
    group = groups.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(group);
}, 'detail')
.pathParam('key', keySchema)
.response(Group, 'The group.')
.summary('Fetch a group')
.description(dd`
  Retrieves a group by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const group = req.body;
  let meta;
  try {
    meta = groups.replace(key, group);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(group, meta);
  res.send(group);
}, 'replace')
.pathParam('key', keySchema)
.body(Group, 'The data to replace the group with.')
.response(Group, 'The new group.')
.summary('Replace a group')
.description(dd`
  Replaces an existing group with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let group;
  try {
    groups.update(key, patchData);
    group = groups.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(group);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the group with.'))
.response(Group, 'The updated group.')
.summary('Update a group')
.description(dd`
  Patches a group with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    groups.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a group')
.description(dd`
  Deletes a group from the database.
`);
