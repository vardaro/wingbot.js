'use strict'
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const request = require('request');
const twilio = require('twilio');
const {MessagingResponse} = require('twilio').twiml;
const app = express();

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: false}));
 
app.post("/sms", function (req, res) {
  const twiml = new MessagingResponse();
  
  twiml.message('the robots are coming');
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});