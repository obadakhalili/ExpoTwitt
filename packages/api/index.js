const express = require("express")
const {
  Validator,
  ValidationError,
} = require("express-json-validator-middleware")

const fs = require("fs")

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
  .get("/interest_bounding_box", (req, res) => {
    try {
      var interestBoundingBox = JSON.parse(
        fs.readFileSync("./interest_bounding_box.json", "utf8"),
      )
    } catch {
      // A bounding box coordinates that wraps around Bilad Al-Sham areas
      var interestBoundingBox = {
        CSV: [33.8601651042, 29.0322226602, 49.1531325131, 37.456605072],
        GeoJSON: [
          [33.8601651042, 29.0322226602],
          [49.1531325131, 29.0322226602],
          [49.1531325131, 37.456605072],
          [33.8601651042, 37.456605072],
        ],
      }
    }
    res.json(interestBoundingBox)
  })
  .post(
    "/interest_bounding_box",
    validate({ body: schema.interestBoundingBox }),
    (req, res) => {
      fs.writeFileSync("./interest_bounding_box.json", JSON.stringify(req.body))
      res.end()
    },
  )
  .use((error, req, res, next) => {
    if (res.headersSent || !(error instanceof ValidationError)) {
      return next(error)
    }

    res.status(400).json({ errors: error.validationErrors })
  })
  .use("*", (req, res) => res.status(404).send("Not found"))
  .listen(
    process.env.PORT,
    console.log(`Listening on port ${process.env.PORT}`),
  )
