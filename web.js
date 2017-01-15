/* @flow */
require('dotenv').config();
const keystone = require('keystone');

var handlebars = require('express-handlebars');

keystone.init({
  'name': 'nvision 2017',
  'brand': 'nvision 2017',

  'favicon': 'public/favicon.ico',
  'less': 'public',
  'static': ['public'],
  'auto update': true,
  'mongo': 'mongodb://localhost/nvision2017',

  'session': true,
  'session store': 'mongo',
  'auth': true,
  'signin url': '/signin',
  'signin redirect': '/dashboard',
  'signout redirect': '/signin',
  'user model': 'User',
  'cookie secret': 'This is a Huuge Secret',
  'views': 'templates/views',
  'custom engine': handlebars.create({
		// layoutsDir: 'templates/views/layouts',
		partialsDir: 'templates/views/partials',
		// defaultLayout: 'default',
		// helpers: new require('./templates/views/helpers')(),
		extname: '.html',
	}).engine,
  'view engine': 'html',
  'port': 3001
});

require('./models');

keystone.set('routes', require('./routes'));

keystone.set('updatesWeb', '');

keystone.start();
