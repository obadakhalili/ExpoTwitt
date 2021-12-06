const Twitter = require("twitter-lite")
const request = require("request")
const nodemailer = require("nodemailer")

const { inspect } = require("util")

const twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
})

request.get(
  `${process.env.ExpoTwitt_API_URL}/interest_bounding_box`,
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
              coords: tweet.coordinates
                ? tweet.coordinates.coordinates
                : tweet.place.bounding_box.coordinates,
            }

            console.log(reducedTweet)

            // index reducedTweet into ES
          } catch (error) {
            reportError(error)
            process.exit(1)
          }
        })
        .on("error", reportError)
    } catch (error) {
      reportError(error)
    }
  },
)

async function reportError(error) {
  const formattedError = inspect(error, { depth: null })

  if (process.env.ENV === "development") {
    return console.log(formattedError)
  }

  const transporter = nodemailer.createTransport({
    service: "",
    auth: {
      user: "",
      pass: "",
    },
  })

  await transporter.sendMail({
    from: "ExpoTwitt Twitter Stream Indexer",
    to: "",
    subject: "Something has went wrong in the indexer",
    html: `<pre>${formattedError}</pre>`,
  })
}
