# ExpoTwitt

A set of services to explore trends and events spatio-temporally through Twitter.

This app is made up of 3 main components, namely:

## Frontend Client

The client has the following story:

- The user is presented with a full-screen searchable map.
- The user can geo-fence a geographical area inside a specified bounding box.
- A histogram showing the Tweets' distribution of the last 5 days over hours in the selected area is shown.
- The user selects a certain timestamp range, enters a search query, and hits “Gain Insights”.
- A multiple tabs widget is shown, where the tabs show the most relevant Tweets and a word cloud of those Tweets words.


## Backend API

The API provides these main services:

- An endpoint to retrieve the Tweets distribution over the last specified `n` hours, in a specified bounding box.

- An endpoint to retrieve the most relevant `n` Tweets, that matches with an optional specified Tweet text, in a specified timestamp range, and a bounding box.

- An endpoint to retrieve the bounding box of interest. i,e. the bounding box the indexing service retrieves to listen to tweets issued from that bounding box and index them in Elasticsearch, and the client retrieves to indicate to the user that only Tweets issued from inside of this bounding box of interest are considered.

- An endpoint to post the interest bounding box.

- An endpoint to delete the interest bounding box.

## Twitter Stream Indexing Service

A service to listen to Tweets issued from the retrieved interest bounding box, and index them in Elasticsearch.
