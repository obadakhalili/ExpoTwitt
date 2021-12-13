const geoJSONCoords = {
  type: "array",
  items: [
    {
      type: "array",
      items: [
        {
          type: "array",
          items: [{ type: "number" }, { type: "number" }],
          minItems: 2,
          maxItems: 2,
        },
      ],
    },
  ],
  minItems: 1,
  maxItems: 1,
}

const geoJSON = {
  type: "object",
  properties: {
    // TODO: make enum
    type: { type: "string" },
    coordinates: geoJSONCoords,
  },
  required: ["type", "coordinates"],
}

exports.tweetsDistrib = {
  type: "object",
  properties: {
    hours: { type: "integer" },
    boundingBox: geoJSON,
  },
  required: ["hours", "boundingBox"],
}

exports.mostTrendyRelevantTweets = {
  type: "object",
  properties: {
    maxTweetsNumber: {
      type: "integer",
      minimum: 0,
      maximum: 10000,
    },
    timestampRange: {
      type: "array",
      items: [{ type: "number" }, { type: "number" }],
    },
    text: { type: "string" },
    boundingBox: geoJSON,
  },
  required: ["maxTweetsNumber", "timestampRange", "boundingBox"],
}

exports.interestBoundingBox = {
  type: "object",
  properties: {
    CSV: {
      type: "array",
      items: [
        { type: "number" },
        { type: "number" },
        { type: "number" },
        { type: "number" },
      ],
      minItems: 4,
      maxItems: 4,
    },
    geoJSONCoords,
  },
  required: ["CSV", "geoJSONCoords"],
}
