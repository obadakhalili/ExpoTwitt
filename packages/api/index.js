const express = require("express")

express()
  .get("/", (req, res) => res.send("Hello World!"))
  .listen(
    process.env.PORT,
    console.log(`Listening on port ${process.env.PORT}`),
  )
