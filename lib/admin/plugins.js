/* #License 
 * 
 * The MIT License (MIT)
 * 
 * This software consists of voluntary contributions made by many
 * individuals. For exact contribution history, see the revision history
 * available at https://github.com/shovelapps/shovelapps-cms
 * 
 * The following license applies to all parts of this software except as
 * documented below:
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 * All files located in the node_modules and external directories are
 * externally maintained libraries used by this software which have their
 * own licenses; we recommend you read them, as their terms may differ from
 * the terms above.
 * 
 * Copyright (c) 2014-2015 Shovel apps, Inc. All rights reserved.
 * (info@shovelapps.com) / www.shovelapps.com / www.shovelapps.org
 */

var db = require("../db"),
  debug = require("debug")("cms:plugins"),
  plugins = require("../db").plugins,
  bodyParser = require("body-parser");
/**
 * Registers URL routes for altering plugins' state
 *
 * @param {express.App} express request handler.
 */
module.exports = function(app) {

  app.cms.menus.registerAdminGroupMenu({
    title: 'Plugins',
    description: 'Manage current plugins or add a new one',
    icon: 'ion-code-working',
    weight: 5
  }, [{
    title: 'Manage plugins',
    href: '/admin/plugins',
    icon: 'ion-code'
  }, {
    title: 'Add plugin',
    href: '/admin/plugins'
  }]);
  app.get("/admin/plugins", function(req, res) {
    debug("Accesed plugins page");
    db.plugins.all(function(err, docs) {
      res.render("../admin/plugins", {
        componentType: 'plugin',
        componentTypePlural: 'plugins',
        components: app.locals.plugins,
        states: docs
      });
    });
  });

  // validar req.params.name que matchee con app.locals.plugins

  app.use(bodyParser.json());

  app.get("/admin/plugin/:name", viewPlugin);
  app.get("/admin/plugin/delete/:name", deletePlugin);
  app.get("/admin/plugin/toggle/:name", togglePlugin);
  app.get("/admin/plugin/config/:name", getConfig);
  app.post("/admin/plugin/config/:name", setConfig);
  app.get("/admin/plugins/:format", getPlugins);
};

function getPlugins(req, res) {
  var format = req.params.name;
  if (typeof format !== 'undefined') {
    format = (['json', 'csv'].indexOf(format) !== -1 ? format : 'json');
  }
  db.plugins.all(function(err, docs) {
    res.type('application/json').status(200).send(docs);
  });
}
/**
 * Middleware for handling the deletion of a plugin
 *
 * @param {express.Request} express Request object.
 * @param {express.Response} express Response object.
 * @param {Function} express next() function.
 */
function deletePlugin(req, res) {
  plugins.remove({
    name: req.params.name
  }, function(err) {
    if (err) {
      return res.send(500, "I errored");
    }
    return res.send(200, "Deleted");
  });
}
/**
 * Middleware for handling the activation/deactivation of a plugin
 *
 * @param {express.Request} express Request object.
 * @param {express.Response} express Response object.
 * @param {Function} express next() function.
 */
function togglePlugin(req, res) {
  plugins.find({
    name: req.params.name
  }, function(err, docs) {
    if (docs.length === 1) {
      plugins.update({
        name: req.params.name
      }, {
        $set: {
          enabled: (docs[0].enabled === 1 ? 0 : 1)
        }
      }, function(err) {
        if (err) {
          return res.send(500, "I errored");
        }
        var state = (docs[0].enabled === 1 ? 'disabled' : 'enabled');
        debug('plugin disabled');
        return res.type('application/json').status(200).send('{"state": "' + state + '", "key": "' + req.params.name + '"}');
      });
    } else {
      debug('plugin not found');
    }
    // docs is an array containing documents Mars, Earth, Jupiter
    // If no document is found, docs is equal to []
  });
}
/**
 * Middleware for rendering the detailed view of a plugin
 *
 * @param {express.Request} express Request object.
 * @param {express.Response} express Response object.
 * @param {Function} express next() function.
 */
function viewPlugin(req, res) {
  debug("Accesed plugin page: " + req.params.name);
  plugins.find({
    name: req.params.name
  }, function(err, docs) {
    res.render("../admin/plugin", {
      componentType: 'plugin',
      componentTypePlural: 'plugins',
      component: docs
    });
  });
}

function getConfig(req, res, next) {


}

function setConfig(req, res) {
  var newConfig = req.body;

  plugins.update({
    name: req.params.name
  }, {
    $set: {
      "config": newConfig
    }
  }, function(err) {
    debug(err);
    res.type('application/json').status(200).send('ok');
  });
}