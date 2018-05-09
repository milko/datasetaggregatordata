'use strict';
const db = require('@arangodb').db;
const collections = [
  "smart_terms",
  "smart_descriptors",
  "smart_toponyms",
  "smart_shapes",
  "smart_users",
  "smart_groups",
  "smart_settings",
  "smart_logs",
  "smart_messages",
  "smart_sessions",
  "smart_studies",
  "smart_annexes",
  "smart_smart",
  "smart_schemas",
  "smart_edges",
  "smart_links"
];

for (const localName of collections) {
  const qualifiedName = module.context.collectionName(localName);
  db._drop(qualifiedName);
}
