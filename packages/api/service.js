const ES = require("@elastic/elasticsearch")

const ESClient = new ES.Client({
  cloud: {
    id: process.env.ES_CLOUD_ID,
    username: process.env.ES_CLOUD_USERNAME,
    password: process.env.ES_CLOUD_PASSWORD,
  },
})

exports.retrieveTweetsDistributionOver = async (hours, boundingBox) => {
  const now = Date.now()
  const hrToMsScaler = 60 * 60 * 1000
  const lowerLimit = now - hours * hrToMsScaler
  const {
    body: {
      _scroll_id: firstScrollId,
      hits: { hits: firstHits },
    },
  } = await ESClient.search({
    index: process.env.ES_INDEX,
    scroll: "2m",
    size: 5000,
    body: {
      _source: false,
      fields: ["timestamp"],
      query: {
        bool: {
          must: [
            {
              range: {
                timestamp: { gte: lowerLimit },
              },
            },
            {
              geo_shape: {
                bounding_box: {
                  shape: boundingBox,

                  /* It's better to leave the default relation, intersect, because:
                   * - Tweets that intersect with the bounding box of interest are indexed, so it's better to maintain a consistent behavior
                   * - It's reasonable to assume that also people around a place of event will tweet about it, not just people in that place of event
                   * - It's more accurate
                   */
                },
              },
            },
          ],
        },
      },
    },
  })

  const hitsTimestamps = (hits) =>
    hits.map(({ fields: { timestamp } }) => timestamp)
  const aggregateTimestampsIntoDistrib = (timestamps, distrib) =>
    timestamps.reduce((distrib, timestamp) => {
      const hourIdx = Math.floor((timestamp - lowerLimit) / hrToMsScaler)
      distrib[hourIdx] += 1
      return distrib
    }, distrib)

  let tweetsDistrib = aggregateTimestampsIntoDistrib(
    hitsTimestamps(firstHits),
    Array(hours).fill(0),
  )

  for (let nextScrollId = firstScrollId; nextScrollId; ) {
    const {
      body: {
        _scroll_id: scrollId,
        hits: { hits: nextHits },
      },
    } = await ESClient.scroll({
      scroll: "2m",
      scrollId: nextScrollId,
    })

    if (nextHits.length === 0) break

    tweetsDistrib = aggregateTimestampsIntoDistrib(
      hitsTimestamps(nextHits),
      tweetsDistrib,
    )
    nextScrollId = scrollId
  }

  return {
    total: tweetsDistrib.reduce((total, frequency) => total + frequency, 0),
    distrib: tweetsDistrib,
  }
}

exports.retrieveTopTrendyRelevantTweets = async (
  maxTweetsNumber,
  [timestampLowerLimit, timestampUpperLimit],
  searchQuery,
  boundingBox,
) => {
  const {
    body: {
      hits: { hits },
    },
  } = await ESClient.search({
    index: process.env.ES_INDEX,
    size: maxTweetsNumber,
    body: {
      query: {
        bool: {
          must: [
            searchQuery && {
              match: {
                text: { query: searchQuery },
              },
            },
            {
              range: {
                timestamp: {
                  gte: timestampLowerLimit,
                  lte: timestampUpperLimit,
                },
              },
            },
            {
              geo_shape: {
                bounding_box: { shape: boundingBox },
              },
            },
          ],
        },
      },
    },
  })

  return { total: hits.length, tweets: hits.map(({ _source }) => _source) }
}
