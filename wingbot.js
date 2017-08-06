// i hope nobody tries to read this
'use strict'

const throng = require('throng');
const WORKERS = process.env.WEB_CONCURRENCY || 1;
const PORT = process.env.PORT || 5000;

const tweeters = [
  'pickupIines',
  'pickuplines',
  'smplepickupInes'
];
const subreddits = [
  'ShittyPickupLines',
  'PickupLines',
];
const platforms = [
  'Reddit',
  'Twitter'
];

// lets gooooo
throng({
  workers: WORKERS,
  lifetime: Infinity,
}, run);

// WHERE THE MAGIC HAPPENS.
function run() {
  const express = require('express');
  const twitter = require('twitter');
  const bodyParser = require('body-parser');
  const { MessagingResponse } = require('twilio').twiml;
  const snoowrap = require('snoowrap');
  const app = express();

  const { env } = process;
  const NO_MAGIC_NUMBERS_HEADASS = 200;

  const reddit = new snoowrap({
    clientId: env.clientId,
    clientSecret: env.clientSecret,
    refreshToken: env.refreshToken,
    userAgent: env.userAgent
  });
  const client = new twitter({
    consumer_key: env.consumer_key,
    consumer_secret: env.consumer_secret,
    access_token_key: env.access_token_key,
    access_token_secret: env.access_token_secret
  });

  app.set('port', PORT);
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(express.static(__dirname + '/src'));

  app.post("/sms", function (req, res) {
    const twiml = new MessagingResponse();
    const reqBody = req.body.Body.trim().toLowerCase();

    if (reqBody === 'shitty' || reqBody === 'pls') {
      console.log('POST: SHITTY');
      const curPlat = extract(platforms);

      if (curPlat === 'Reddit') {
        console.log('REDDIT');
        const curSub = extract(subreddits);
        // grabs a subreddit
        console.log('GETTING SUB: ' + curSub);
        reddit.getSubreddit(curSub)
          .getTop({ time: 'all', limit: 100 })
          .then((submissions) => {
            // grab a random submission
            let line = extract(submissions);
            while (line.selftext.length > 160) { // cut down the array to find a short line
              let dex = submissions.indexOf(line);
              submissions = submissions.splice(dex, 1);
              line = extract(submissions);
              console.log("IDK");
            }
            const message = twiml.message();

            if (line.url.includes('imgur') || line.url.includes('reddituploads') || line.url.includes('i.redd.it')) {
              message.media(line.url); // if media, include media
              console.log('IMG: ' + line.url);
            }
            const mesBody = line.selftext ?
              `${line.title}\n\n${line.selftext}` :
              `${line.title}`;
            // send
            message.body(mesBody);
            console.log(mesBody);
            res.writeHead(NO_MAGIC_NUMBERS_HEADASS, { 'Content-Type': 'text/xml' });
            res.end(twiml.toString());
            console.log('RESP SENT');
          });
      } else if (curPlat === 'Twitter') { // req to twitter
        console.log('TWITTER');
        // get a user
        const curUser = extract(tweeters);
        console.log('USER: ' + curUser);
        const request = buildReq(curUser);
        // make the request
        client.get('statuses/user_timeline', request, (err, tweet, resp) => {
          if (err) console.log('WTF');
          // get a tweet
          const curTweet = extract(tweet);
          twiml.message(curTweet.text);
          res.writeHead(NO_MAGIC_NUMBERS_HEADASS, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
          console.log('RESP SENT');
        });
      }
    } else {
      console.log(`GIRLS NAME: ${reqBody}`); // i think
      res.writeHead(NO_MAGIC_NUMBERS_HEADASS, { 'Content-Type': 'text/xml' });

      reddit.getSubreddit('PickupLines')
        .search({ query: reqBody, time: 'all', sort: 'relavance' })
        .then((submissions) => {
          if (submissions.length) { // check if the query is truthy
            const curSub = extract(submissions);
            reddit.getSubmission(curSub.id) // focus one submission
              .expandReplies({ limit: Infinity, depth: Infinity })
              .then((withReplies) => {
                if (withReplies.comments.length) { // truthy check the comments
                  console.log(withReplies.comments);
                  const curRep = extract(withReplies.comments);
                  const twimlResp = `${curSub.title}\n\n${curRep.body}`;
                  twiml.message(twimlResp);
                  res.end(twiml.toString());
                  console.log('RESP SENT');
                } else {
                  twiml.message('ehh');
                  res.end(twiml.toString());
                  console.log('RESP SENT');
                }
              });
          } else {
            twiml.message(`idk`);
            res.end(twiml.toString());
            console.log('RESP SENT');
          }
        });
    }
  });

  app.get('*', function (req, res) {
    res.sendFile(__dirname + '/src/index.html');
  });
  app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
  });

  // returns a random object from the arra
  function extract(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  // returns an object of twitter api params 
  // with a dynamic screen_name
  function buildReq(tweeter) {
    return {
      screen_name: tweeter,
      trim_user: true,
      count: 100,
      exclude_replies: true,
      include_rts: false
    }
  }
}
