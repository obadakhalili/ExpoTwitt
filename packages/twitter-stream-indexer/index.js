const Twitter = require("twitter-lite")
const request = require("request")

const { inspect } = require("util")

const twitterClient = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
})

request.get(
  `${process.env.ExpoTwitt_API}/interest_bounding_box`,
  (error, response, body) => {
    try {
      if (error) {
        throw error
      }

      const { CSV: indexingBoundingBox } = JSON.parse(body)

      twitterClient
        .stream("statuses/filter", {
          locations: indexingBoundingBox,
        })
        .on("data", (tweet) => {
          try {
            const reducedTweet = {
              author_username: tweet.user.screen_name,
              id: tweet.id_str,
              text: tweet.truncated
                ? tweet.extended_tweet.full_text
                : tweet.text,
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
  },
)

function reportDefunctToAdmin(error) {
  console.log(inspect(error, { depth: null }))
}
