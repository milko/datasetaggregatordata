'use strict';
const db = require('@arangodb').db;
const documentCollections = [
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
  "smart_smart"
];
const edgeCollections = [
  "smart_schemas",
  "smart_edges",
  "smart_links"
];

for (const localName of documentCollections) {
  const qualifiedName = module.context.collectionName(localName);
  if (!db._collection(qualifiedName)) {
    db._createDocumentCollection(qualifiedName);
  } else if (module.context.isProduction) {
    console.debug(`collection ${qualifiedName} already exists. Leaving it untouched.`)
  }
}

for (const localName of edgeCollections) {
  const qualifiedName = module.context.collectionName(localName);
  if (!db._collection(qualifiedName)) {
    db._createEdgeCollection(qualifiedName);
  } else if (module.context.isProduction) {
    console.debug(`collection ${qualifiedName} already exists. Leaving it untouched.`)
  }
}
