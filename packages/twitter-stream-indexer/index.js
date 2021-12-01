const { inspect } = require("util")
const needle = require("needle")

const token = process.env.BEARER_TOKEN

const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules"

const rules = [
  {
    value: "has:geo",
    tag: "contains geo-info",
  },
]

const streamURL =
  "https://api.twitter.com/2/tweets/search/stream?tweet.fields=id,text,created_at,geo&expansions=author_id"

;(async () => {
  try {
    const response = await needle(
      "post",
      rulesURL,
      { add: rules },
      {
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
      },
    )

    if (response.statusCode !== 201) {
      throw response.body
    }

    const stream = needle.get(streamURL, {
      headers: {
        "User-Agent": "ExpoTwitt",
        Authorization: `Bearer ${token}`,
      },
      timeout: 20000,
    })

    stream
      .on("data", (response) => {
        try {
          console.log(inspect(JSON.parse(response), { depth: null }))

          // const {
          //   data: { id, text, created_at },
          //   includes: {
          //     users: [{ username: author_username }],
          //   },
          // } = JSON.parse(response)
          // const tweet = { author_username, id, text, timestamp: Date(created_at).getTime() }
          // console.log(tweet)
        } catch {
          reportDefunctToAdmin(response)
        }
      })
      .on("err", reportDefunctToAdmin)
  } catch (error) {
    reportDefunctToAdmin(error)
  }
})()

function reportDefunctToAdmin(defunct) {
  console.log(inspect(defunct, { depth: null }))
}
