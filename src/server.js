const {WIT_TOKEN, SERVER_PORT} = require('./config');
const createEngine = require('./createEngine');
const express = require('express');

// ------------------------------------------------------------
// Manage Context

const _store = {};

function getContext(sessionId) {
  return _store[sessionId] || {};
};

function setContext(sessionId, ctx) {
  _store[sessionId] = ctx;
};

// ------------------------------------------------------------
// Express

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/chat', (req, res) => {
  const actions = [];
  const cb = (action) => actions.push(action);
  const {text, sessionId} = req.query;
  const engine = createEngine(WIT_TOKEN, cb);
  engine.runActions(
    sessionId,
    text,
    getContext(sessionId)
  ).then(
    context => {
      // Context should not be returning an empty which it currently is (sy)
      console.log(context, 'context');
      console.log(actions, 'action');
      res.status(200).json({context, actions}); // send back "objects"
      setContext(sessionId, context)
    },
    err => {
      console.log('[engine] error', err);
      res.status(500).send('something went wrong :\\');
    }
  );
});

app.listen(SERVER_PORT);
