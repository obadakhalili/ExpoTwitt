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

exports.topTrendyRelevantTweets = {
  type: "object",
  properties: {
    tweetsNumber: { type: "integer" },
    timestampRange: {
      type: "array",
      items: [
        {
          type: "number",
        },
        {
          type: "number",
        },
      ],
    },
    searchQuery: { type: "string" },
    geofencedCircle: {
      type: "object",
      properties: {
        lat: {
          type: "number",
        },
        lan: {
          type: "number",
        },
        radius: {
          type: "number",
        },
      },
      required: ["lat", "lng", "radius"],
    },
  },
  required: [
    "tweetsNumber",
    "timestampRange",
    "searchQuery",
    "geofencedCircle",
  ],
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
