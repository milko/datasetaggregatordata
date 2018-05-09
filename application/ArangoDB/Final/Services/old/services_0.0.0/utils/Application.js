'use strict';

const dd = require('dedent');							// For multiline text.
const fs = require('fs');								// File system utilities.
const db = require('@arangodb').db;						// Database framework.
const Joi = require('joi');								// Validation framework.
const httpError = require('http-errors');				// HTTP errors.
const status = require('statuses');						// Don't know what it is.
const errors = require('@arangodb').errors;				// ArangoDB errors.

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

/**
 * Collection names
 */
const kCollectionSettings	 = 'settings';
const kCollectionSessions	 = 'sessions';
const kCollectionLogs		 = 'logs';
const kCollectionMessages	 = 'messages';

const kCollectionUsers		 = 'users';
const kCollectionGroups		 = 'groups';
const kCollectionHierarchies = 'hierarchies';

const kCollectionTerms		 = 'terms';
const kCollectionDescriptors = 'descriptors';
const kCollectionSchemas	 = 'schemas';

const kCollectionStudies	 = 'studies';
const kCollectionAnnexes	 = 'annexes';
const kCollectionSmart		 = 'smart';
const kCollectionLinks		 = 'links';

const kCollectionToponyms	 = 'toponyms';
const kCollectionShapes		 = 'shapes';
const kCollectionEdges		 = 'edges';

/**
 * Default constants
 *
 * These are used in the absence of terms and descriptors.
 */
const kDefaultLanguage		= 'ISO:639:3:eng';		// English.
const kDefaultAdmCode		= 'admin';				// Default administrator user code.

const kRankSystem			= ':rank:system';		// System rank.

const kRoleUser				= ':role:user';			// Create users role.
const kRoleBatch			= ':role:batch';		// Initiate batch jobs role.
const kRoleUpload			= ':role:upload';		// Perform uploads role.
const kRoleMetadata			= ':role:meta';			// Manage metadata role.
const kRoleSync				= ':role:sync';			// Synchronise data role.
const kRoleSuggest			= ':role:suggest';		// Make suggestions role.
const kRoleDictionary		= ':role:dict';			// Manage data dictionary role.
const kRoleCommit			= ':role:commit';		// Perform harmonisation commits role.
const kRoleQuery			= ':role:query';		// Perform data queries role.
const kRoleDownload			= ':role:download';		// Perform data downloads role.

const kPropertyName			= 'name';				// Name property.
const kPropertyUsername		= 'username';			// Username property.
const kPropertyEmail		= 'email';				// E-mail property.
const kPropertyLanguage		= 'language';			// Preferred language property.
const kPropertyRank			= 'rank';				// Rank property.
const kPropertyRole			= 'role';				// Role property.
const kPropertyStatus		= 'status';				// Status property.

const kParameterCode		= 'code';				// Code parameter.
const kParameterPassword	= 'pass';				// Password parameter.
const kParameterUser		= 'user';				// User parameter.

/**
 * Settings constants
 *
 * These constants represent the different settings keys.
 */
const kSettingsStatus		= 'status';				// Settings status key.
const kSettingsStatusApp	= 'application';		// Application status key.
const kSettingsStatusCol	= 'collections';		// Collection status key.
const kSettingsStatusOK		= 'OK';					// Application is operative.
const kSettingsStatusEmpty	= 'empty';				// Missing required data.

module.exports = class Application
{
	//
	// Constructor.
	//
	constructor() {}

	//
	// Collections info.
	//
	static get settingsCollection() {
		return {
			name	: kCollectionSettings
		};
	}
	static get sessionsCollection() {
		return {
			name	: kCollectionSessions
		};
	}
	static get logsCollection() {
		return {
			name	: kCollectionLogs
		};
	}
	static get messagesCollection() {
		return {
			name	: kCollectionMessages
		};
	}
	static get usersCollection() {
		return {
			name	: kCollectionUsers,
			index	: [
				{
					type:	'hash',
					fields:	[ 'username' ],
					unique:	true,
					sparse:	false
				}
			]
		};
	}
	static get groupsCollection() {
		return {
			name	: kCollectionGroups
		};
	}
	static get hierarchiesCollection() {
		return {
			name	: kCollectionHierarchies
		};
	}
	static get termsCollection() {
		return {
			name	: kCollectionTerms
		};
	}
	static get descriptorsCollection() {
		return {
			name	: kCollectionDescriptors
		};
	}
	static get schemasCollection() {
		return {
			name	: kCollectionSchemas
		};
	}
	static get studiesCollection() {
		return {
			name	: kCollectionStudies
		};
	}
	static get annexesCollection() {
		return {
			name	: kCollectionAnnexes
		};
	}
	static get smartCollection() {
		return {
			name	: kCollectionSmart
		};
	}
	static get linksCollection() {
		return {
			name	: kCollectionLinks
		};
	}
	static get toponymsCollection() {
		return {
			name	: kCollectionToponyms
		};
	}
	static get shapesCollection() {
		return {
			name	: kCollectionShapes
		};
	}
	static get edgesCollection() {
		return {
			name	: kCollectionEdges
		};
	}

	//
	// Document collections.
	//
	static get documentCollections() {
		return [
			this.settingsCollection,
			this.messagesCollection,
			this.sessionsCollection,
			this.logsCollection,
			this.termsCollection,
			this.descriptorsCollection,
			this.usersCollection,
			this.groupsCollection,
			this.studiesCollection,
			this.annexesCollection,
			this.smartCollection,
			this.toponymsCollection,
			this.shapesCollection
		];
	}

	//
	// Edge collections.
	//
	static get edgeCollections() {
		return [
			this.schemasCollection,
			this.hierarchiesCollection,
			this.linksCollection,
			this.edgesCollection
		];
	}

	//
	// Default constants.
	//
	static get defaultLanguage()	{ return kDefaultLanguage; }
	static get defaultAdmCode()		{ return kDefaultAdmCode; }

	static get rankSystem()			{ return kRankSystem; }

	static get roleUser()			{ return kRoleUser; }
	static get roleBatch()			{ return kRoleBatch; }
	static get roleUpload()			{ return kRoleUpload; }
	static get roleMetadata()		{ return kRoleMetadata; }
	static get roleSync()			{ return kRoleSync; }
	static get roleSuggest()		{ return kRoleSuggest; }
	static get roleDictionary()		{ return kRoleDictionary; }
	static get roleCommit()			{ return kRoleCommit; }
	static get roleQuery()			{ return kRoleQuery; }
	static get roleDownload()		{ return kRoleDownload; }

	static get propertyName()		{ return kPropertyName; }
	static get propertyUsername()	{ return kPropertyUsername; }
	static get propertyEmail()		{ return kPropertyEmail; }
	static get propertyLanguage()	{ return kPropertyLanguage; }
	static get propertyRank()		{ return kPropertyRank; }
	static get propertyRole()		{ return kPropertyRole; }
	static get propertyStatus()		{ return kPropertyStatus; }

	static get parameterCode()		{ return kParameterCode; }
	static get parameterPass()		{ return kParameterPassword; }
	static get parameterUser()		{ return kParameterUser; }

	//
	// Settings constants.
	//
	static get settingsStatus()			{ return kSettingsStatus; }
	static get settingsStatusApp()		{ return kSettingsStatusApp; }
	static get settingsStatusCol()		{ return kSettingsStatusCol; }
	static get settingsStatusOK()		{ return kSettingsStatusOK; }
	static get settingsStatusEmpty()	{ return kSettingsStatusEmpty; }
};
