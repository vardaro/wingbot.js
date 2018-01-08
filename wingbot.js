'use strict'

const throng = require('throng');
const WORKERS = process.env.WEB_CONCURRENCY || 1;
const PORT = process.env.PORT || 5000;

const tweeters = [
  'pickupIines',
  'pickuplines',
  'smplepickupInes',
  'ComCorny',
  'Pickupthatgirl'
];
const subreddits = [
  'ShittyPickupLines',
  'PickupLines',
];
const platforms = [
  'Reddit',
  'Twitter'
];
const throngConfig = { workers: WORKERS, lifetime: Infinity };

throng(throngConfig, run);

function run() {
  const express = require('express');
  const twitter = require('twitter');
  const bodyParser = require('body-parser');
  const { MessagingResponse } = require('twilio').twiml;
  const snoowrap = require('snoowrap');
  const app = express();

  const { env } = process;
  const OK = 200;

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

    // words to make bot proc
    if (reqBody === 'shitty' || reqBody === 'pls') {
      console.log('POST: SHITTY');

      //get a random platform (reddit or twitter)
      const curPlat = rand(platforms);

      if (curPlat === 'Reddit') {
        console.log('REDDIT');

        // get a random subreddit
        const curSub = rand(subreddits);

        // grabs a subreddit
        console.log('GETTING SUB: ' + curSub);
        reddit.getSubreddit(curSub)
          .getTop({ time: 'all', limit: 100 })
          .then((submissions) => {
            // grab a random submission
            let line = rand(submissions);

            const message = twiml.message();

            // attach media if present
            if (line.url.includes('imgur') || line.url.includes('reddituploads') || line.url.includes('i.redd.it')) {
              message.media(line.url);
              console.log('IMG: ' + line.url);
            }

            const mesBody = line.selftext ?
              `${line.title}\n\n${line.selftext}` :
              `${line.title}`;

            // send
            message.body(mesBody);
            console.log(`RESP: ${mesBody}`);
            res.writeHead(OK, { 'Content-Type': 'text/xml' });
            res.end(twiml.toString());
            console.log('RESP SENT');
          });
      } else if (curPlat === 'Twitter') {
        console.log('PLATFORM: TWITTER');

        // get a random twitter user
        const curUser = rand(tweeters);
        console.log('USER: ' + curUser);
        const request = {
          screen_name: curUser,
          trim_user: true,
          count: 100,
          exclude_replies: true,
          include_rts: false
        };

        // make the request
        client.get('statuses/user_timeline', request, (err, tweet, resp) => {
          if (err) console.log('WTF');

          // get a tweet
          const curTweet = rand(tweet);
          twiml.message(curTweet.text);
          console.log(`RESP: ${curTweet.text}`);
          res.writeHead(OK, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
          console.log('RESP SENT');
        });
      }
    } else {
      // if the request does not include a proc word, just assume its a girls name i guess lol
      console.log(`GIRLS NAME: ${reqBody}`);
      res.writeHead(OK, { 'Content-Type': 'text/xml' });

      reddit.getSubreddit('PickupLines')
        .search({ query: reqBody, time: 'all', sort: 'relavance' })
        .then((submissions) => {
          if (submissions.length) { // check if the query is truthy

            // get a random submission from query results
            const curSubmission = rand(submissions);
            reddit.getSubmission(curSubmission.id) // focus one submission
              .expandReplies({ limit: Infinity, depth: Infinity })
              .then((withReplies) => {

                if (withReplies.comments.length) { // truthy check the comments

                  // get a random respose from the post
                  const curRep = rand(withReplies.comments);
                  const twimlResp = `${curSubmission.title}\n${curSubmission.selftext}\n\n${curRep.body}`;
                  console.log(`RESP: ${twimlResp}`);
                  twiml.message(twimlResp);
                  res.end(twiml.toString());
                  console.log('RESP SENT');
                } else {
                  twiml.message('nothing good');
                  res.end(twiml.toString());
                  console.log('Post found without comments');
                }
              });
          } else {
            twiml.message(`idk`);
            res.end(twiml.toString());
            console.log('No results from query');
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
  function rand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
