const ES = require("@elastic/elasticsearch")
const request = require("request-promise")
const Twitter = require("twitter-lite")

async function startIndexingTwitterStream() {
  const ESClient = new ES.Client({
    node: process.env.ES_NODE,
    auth: {
      username: process.env.ES_USERNAME,
      password: process.env.ES_PASSWORD,
    }
  })

  const twitterClient = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  })

  const { CSV: indexingBoundingBox } = JSON.parse(
    await request({
      url: `${process.env.ExpoTwitt_API_URL}/interest_bounding_box`,
    }),
  )

  const bulkInsert = bulkInsertion()

  bulkInsert.next()

  twitterClient
    .stream("statuses/filter", { locations: indexingBoundingBox })
    .on("start", () => console.log("Twitter stream started"))
    .on("data", (tweet) => {
      const reducedTweet = {
        author_username: tweet.user.screen_name,
        id: tweet.id_str,
        text: tweet.truncated ? tweet.extended_tweet.full_text : tweet.text,
        timestamp: tweet.timestamp_ms,
        lang: tweet.lang
      }

      if (tweet.coordinates) {
        reducedTweet.bounding_box = tweet.coordinates
      } else {
        reducedTweet.bounding_box = tweet.place.bounding_box
        const bboxCoords = reducedTweet.bounding_box.coordinates[0]
        bboxCoords.push(bboxCoords[0])
      }

      bulkInsert.next(reducedTweet)
    })
    .on("error", () => {
      console.log("Something went wrong while listening to Twitter stream")
      console.log("Error", error)
    })

  function* bulkInsertion() {
    const docsCountPerInsertion = 100
    let toInsert = []

    while (true) {
      ESClient.bulk({
        index: process.env.ES_INDEX,
        body: toInsert
          .concat(yield)
          .flatMap((tweet) => [
            { index: { _index: process.env.ES_INDEX } },
            tweet,
          ]),
      })

      toInsert = []

      while (toInsert.length < docsCountPerInsertion - 1) {
        toInsert.push(yield)
      }
    }
  }
}

startIndexingTwitterStream().catch(console.log)
