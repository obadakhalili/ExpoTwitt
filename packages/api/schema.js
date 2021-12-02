exports.tweetsDistrib = {
  type: "object",
  properties: {
    hours: { type: "integer" },
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
  required: ["hours", "geofencedCircle"],
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
    GeoJSON: {
      type: "array",
      items: [
        {
          type: "array",
          items: [{ type: "number" }, { type: "number" }],
          minItems: 2,
          maxItems: 2,
        },
        {
          type: "array",
          items: [{ type: "number" }, { type: "number" }],
          minItems: 2,
          maxItems: 2,
        },
        {
          type: "array",
          items: [{ type: "number" }, { type: "number" }],
          minItems: 2,
          maxItems: 2,
        },
        {
          type: "array",
          items: [{ type: "number" }, { type: "number" }],
          minItems: 2,
          maxItems: 2,
        },
      ],
      minItems: 4,
      maxItems: 4,
    },
  },
  required: ["CSV", "GeoJSON"],
}
