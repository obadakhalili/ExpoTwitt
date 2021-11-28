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
