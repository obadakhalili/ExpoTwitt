const express = require("express")
const {
  Validator,
  ValidationError,
} = require("express-json-validator-middleware")

const schema = require("./schema")
const service = require("./service")

const { validate } = new Validator()

express()
  .use(express.json())
  .get(
    "/tweets_distrib",
    validate({ body: schema.tweetsDistrib }),
    (req, res) => {
      const { hours, geofencedCircle } = req.body

      res.json(service.retrieveTweetsDistributionOver(hours, geofencedCircle))
    },
  )
  .get(
    "/top_trendy_relevant_tweets",
    validate({ body: schema.topTrendyRelevantTweets }),
    (req, res) => {
      const { tweetsNumber, timestampRange, searchQuery, geofencedCircle } =
        req.body

      res.json(
        service.retrieveTopTrendyRelevantTweets(
          tweetsNumber,
          timestampRange,
          searchQuery,
          geofencedCircle,
        ),
      )
    },
  )
  .use((error, req, res, next) => {
    if (res.headersSent || !error instanceof ValidationError) {
      return next(error)
    }

    res.status(400).json({ errors: error.validationErrors })
  })
  .use("*", (req, res) => res.status(404).send("Not found"))
  .listen(
    process.env.PORT,
    console.log(`Listening on port ${process.env.PORT}`),
  )
