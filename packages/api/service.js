const faker = require("faker")

exports.retrieveTweetsDistributionOver = (hours, geofencedCircle) =>
  Array.from({ length: hours }, () => faker.datatype.number(1000))

exports.retrieveTopTrendyRelevantTweets = (
  tweetsNumber,
  timestampRange,
  searchQuery,
  geofencedCircle,
) => Array.from({ length: tweetsNumber }, () => faker.lorem.sentence())
