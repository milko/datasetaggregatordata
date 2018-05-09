'use strict';

module.context.use('/smart_terms', require('./routes/smart_terms'), 'smart_terms');
module.context.use('/smart_descriptors', require('./routes/smart_descriptors'), 'smart_descriptors');
module.context.use('/smart_toponyms', require('./routes/smart_toponyms'), 'smart_toponyms');
module.context.use('/smart_shapes', require('./routes/smart_shapes'), 'smart_shapes');
module.context.use('/smart_users', require('./routes/smart_users'), 'smart_users');
module.context.use('/smart_groups', require('./routes/smart_groups'), 'smart_groups');
module.context.use('/smart_settings', require('./routes/smart_settings'), 'smart_settings');
module.context.use('/smart_logs', require('./routes/smart_logs'), 'smart_logs');
module.context.use('/smart_messages', require('./routes/smart_messages'), 'smart_messages');
module.context.use('/smart_sessions', require('./routes/smart_sessions'), 'smart_sessions');
module.context.use('/smart_studies', require('./routes/smart_studies'), 'smart_studies');
module.context.use('/smart_annexes', require('./routes/smart_annexes'), 'smart_annexes');
module.context.use('/smart_smart', require('./routes/smart_smart'), 'smart_smart');
module.context.use('/smart_schemas', require('./routes/smart_schemas'), 'smart_schemas');
module.context.use('/smart_edges', require('./routes/smart_edges'), 'smart_edges');
module.context.use('/smart_links', require('./routes/smart_links'), 'smart_links');

module.context.use('/test', require('./routes/test'), 'test');

const Application = require( 'utils.Application' );
let application = new Application();