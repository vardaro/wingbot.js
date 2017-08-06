// i hope nobody tries to read this

'use strict'
const express = require('express');
const twitter = require('twitter');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;
const snoowrap = require('snoowrap');
const app = express();

const { env } = process;
const DEFAULT = 5000;
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
const tweeters = [
  'pickupIines',
  'pickuplines',
  'smplepickupInes'
];
const subreddits = [
  'ShittyPickupLines',
  'PickupLines'
];
const platforms = [
  'Reddit',
  'Twitter'
];

app.set('port', process.env.PORT || DEFAULT);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/src'));

app.post("/sms", function (req, res) {
  const twiml = new MessagingResponse();
  const reqBody = req.body.Body.trim().toLowerCase();

  if (reqBody === 'shitty' || reqBody === 'help') {
    console.log('POST: SHITTY');
    const curPlat = extract(platforms);

    if (curPlat === 'Reddit') {
      console.log('REDDIT');
      const curSub = extract(subreddits);
      // grabs a subreddit
      console.log('GETTING SUB: ' + curSub);
      reddit.getSubreddit(curSub)
        .getTop({ time: 'all' })
        .then((submissions) => {
          // grab a random submission
          const line = extract(submissions);
          const message = twiml.message();

          if (line.url.includes('imgur') ||
            line.url.includes('reddituploads') ||
            line.url.includes('i.redd.it')) {
            message.media(line.url); // if media, include media
            console.log('IMG: ' + line.url);
          }
          // build <resp/> using the hip n jive es6 str templating thing
          const mesBody = line.selftext ?
            `${line.title}\n\n${line.selftext}` :
            `${line.title}`;

          message.body(mesBody);
          console.log(mesBody);
          res.writeHead(OK, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
          console.log('RESP SENT');
        });
    } else if (curPlat === 'Twitter') { // req to twitter pickuplines
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
        res.writeHead(OK, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
        console.log('RESP SENT');
      });
    }
  } else {
    console.log('GIRLS NAME'); // i think
    res.writeHead(OK, { 'Content-Type': 'text/xml' });

    reddit.getSubreddit('PickupLines')
      .search({ query: reqBody, time: 'all', sort: 'relavance' })
      .then((submissions) => {
        if (submissions) { // check if the query returns anything
          const curSub = extract(submissions);
          reddit.getSubmission(curSub.id) // focus one 1 submission
            .expandReplies({ limit: Infinity, depth: Infinity })
            .then((withReplies) => {
              if (withReplies.comments) {
                console.log(withReplies.comments);
                const curRep = extract(withReplies.comments);
                const twimlResp = `${curSub.title}\n\n${curRep.body}`;
                twiml.message(twimlResp);
                res.end(twiml.toString());
                console.log('RESP SENT');
              } else {
                twiml.message('idk haha :/');
                res.end(twiml.toString());
                console.log('RESP SENT');
              }
            });
        } else {
          twiml.message('idk lol');
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