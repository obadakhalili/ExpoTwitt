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
    async (req, res, next) => {
      try {
        const { hours, boundingBox } = req.body
        res.json(
          await service.retrieveTweetsDistributionOver(hours, boundingBox),
        )
      } catch (error) {
        next(error)
      }
    },
  )
  .get(
    "/top_trendy_relevant_tweets",
    validate({ body: schema.topTrendyRelevantTweets }),
    async (req, res, next) => {
      try {
        const { maxTweetsNumber, timestampRange, searchQuery, boundingBox } =
          req.body

        res.json(
          await service.retrieveTopTrendyRelevantTweets(
            maxTweetsNumber,
            timestampRange,
            searchQuery,
            boundingBox,
          ),
        )
      } catch (error) {
        next(error)
      }
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
        CSV: [34.03, 28.88, 48.98, 37.4],
        geoJSONCoords: [
          [
            [46.7525012868, 28.8790893301],
            [44.5025020915, 29.0943554465],
            [39.3521109301, 31.9556759086],
            [37.383360796, 31.4171964485],
            [38.3677361983, 30.512837464],
            [36.3989860642, 28.9714007613],
            [34.8169548142, 29.1557778193],
            [34.0259391892, 31.1317441226],
            [35.8364859301, 36.7703692669],
            [44.9419552165, 37.4013812582],
            [46.6821898597, 35.8211710832],
            [45.8208614665, 34.136150564],
            [48.1763304847, 31.8512152792],
            [47.8950794118, 31.2069469613],
            [48.9849239665, 29.7679721491],
            [47.3853148597, 29.9052052979],
            [46.7525012868, 28.8790893301],
          ],
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
  .delete("/interest_bounding_box", (req, res) => {
    try {
      fs.unlinkSync("./interest_bounding_box.json")
    } finally {
      res.end()
    }
  })
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
