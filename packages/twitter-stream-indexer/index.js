const { inspect } = require("util")
const Twitter = require("twitter-lite")

const twitterClient = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
})

try {
  twitterClient
    .stream("statuses/filter", {
      locations: process.env.INDEXING_BOUNDING_BOX_CSV,
    })
    .on("data", (tweet) => {
      try {
        const reducedTweet = {
          author_username: tweet.user.screen_name,
          id: tweet.id_str,
          text: tweet.truncated ? tweet.extended_tweet.full_text : tweet.text,
          timestamp: tweet.timestamp_ms,
          coords: tweet.geo
            ? tweet.geo.coordinates
            : tweet.place.bounding_box.coordinates[0].map(([lng, lat]) => [
                lat,
                lng,
              ]),
        }

        console.log(reducedTweet)

        // index reducedTweet into ES
      } catch (error) {
        reportDefunctToAdmin(error)
      }
    })
    .on("error", reportDefunctToAdmin)
} catch (error) {
  reportDefunctToAdmin(error)
}

function reportDefunctToAdmin(error) {
  console.log(inspect(error, { depth: null }))
}
