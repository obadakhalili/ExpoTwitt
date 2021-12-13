import { defineComponent, ref, watchEffect, onMounted, reactive } from "vue"
import {
  useDialog,
  NSpin,
  NModal,
  NCard,
  NButton,
  NInput,
  NDatePicker,
  NH3,
  NTabs,
  NTabPane,
  NList,
  NListItem,
  NThing,
} from "naive-ui"
import Leaflet from "leaflet"
import {
  Chart,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
} from "chart.js"
import {
  WordCloudChart,
  WordCloudController,
  WordElement,
} from "chartjs-chart-wordcloud"
import "@geoman-io/leaflet-geoman-free"
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css"
import "leaflet/dist/leaflet.css"

const API_URL = import.meta.env.VITE_ExpoTwitt_API_URL || "/api"

Chart.register(
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  WordCloudController,
  WordElement,
)

let firstTimeVisiting = true

if (localStorage.getItem("visitedBefore")) {
  firstTimeVisiting = false
} else {
  localStorage.setItem("visitedBefore", true)
}

export default defineComponent({
  name: "App",
  setup: () => {
    onMounted(() => document.getElementById("app").classList.add("h-screen"))

    if (firstTimeVisiting) {
      const dialog = useDialog()

      dialog.create({
        title: "Welcome to ExpoTwitt",
        content:
          "Geofence your are of interest inside the specified bounding box to gain insights about whats happening there",
      })
    }

    const indexedBoundingBox = ref()
    const geofencedBoundingBoxLayer = ref()
    const showDistribModal = ref(false)
    const tweetsDistrib = ref()
    const tweetsDistribCanvas = ref()
    const distribLengthInHrs = 120
    const now = Date.now()
    const relevantTweetsFixedRange = [
      now - distribLengthInHrs * 60 * 60 * 1000,
      now,
    ]
    const relevantTweetsQuery = reactive({
      text: "",
      timestampRange: [
        relevantTweetsFixedRange[0],
        relevantTweetsFixedRange[1],
      ],
    })
    let chart
    const showInsightsModal = ref(false)
    const mostRelevantTweets = ref()
    const tweetsWordCloudCanvas = ref()

    fetch(`${API_URL}/interest_bounding_box`)
      .then((response) => response.json())
      .then(({ geoJSONCoords }) => (indexedBoundingBox.value = geoJSONCoords))

    watchEffect(() => {
      if (tweetsDistribCanvas.value && tweetsDistrib.value) {
        const sortedDistrib = tweetsDistrib.value.slice().sort((a, b) => a - b)
        const Q1 = sortedDistrib[Math.floor(sortedDistrib.length * 0.25)]
        const Q3 = sortedDistrib[Math.floor(sortedDistrib.length * 0.75)]
        const IQR = Q3 - Q1
        const upperLimitOutlier = Q3 + IQR

        chart = new Chart(tweetsDistribCanvas.value.getContext("2d"), {
          type: "bar",
          data: {
            labels: Array.from({ length: distribLengthInHrs }, (_, i) =>
              new Date(
                Date.now() - (distribLengthInHrs - i) * 60 * 60 * 1000,
              ).toLocaleDateString("en-US", { hour: "numeric" }),
            ),
            datasets: [
              {
                data: tweetsDistrib.value,
                backgroundColor: tweetsDistrib.value.map((frequency) =>
                  frequency > upperLimitOutlier
                    ? "rgba(255, 99, 132, 0.2)"
                    : "rgba(54, 162, 235, 0.2)",
                ),
              },
            ],
          },
        })
      }
    })

    watchEffect(() => {
      if (tweetsWordCloudCanvas.value && mostRelevantTweets.value) {
        const tweetsWordsFrequencies = mostRelevantTweets.value
          .map(({ text }) => text)
          .reduce((frequencies, sentence) => {
            sentence
              .split(" ")
              .forEach(
                (word) =>
                  (frequencies[word] = frequencies[word]
                    ? frequencies[word] + 1
                    : 1),
              )
            return frequencies
          }, {})

        const data = {
          labels: Object.keys(tweetsWordsFrequencies),
          datasets: [
            {
              data: Object.values(tweetsWordsFrequencies),
            },
          ],
        }

        new WordCloudChart(tweetsWordCloudCanvas.value.getContext("2d"), {
          data,
        })
      }
    })

    watchEffect(
      () => {
        if (indexedBoundingBox.value) {
          const polygon = Leaflet.geoJSON(
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: indexedBoundingBox.value,
              },
            },
            { fill: false },
          )
          const polygonBounds = polygon.getBounds()

          const map = Leaflet.map("map")
            .setView(polygonBounds.getCenter(), 1)
            .addLayer(
              Leaflet.tileLayer(
                "http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
                {
                  subdomains: ["mt0", "mt1", "mt2", "mt3"],
                },
              ),
            )
            .addLayer(polygon)
            .fitBounds(polygonBounds)
            .on("pm:create", ({ layer }) => {
              geofencedBoundingBoxLayer.value = layer
              showDistribModal.value = true
              relevantTweetsQuery.boundingBox = layer.toGeoJSON().geometry

              fetch(`${API_URL}/tweets_distrib`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  hours: distribLengthInHrs,
                  boundingBox: relevantTweetsQuery.boundingBox,
                }),
              })
                .then((response) => response.json())
                .then(({ distrib }) => (tweetsDistrib.value = distrib))
            })

          if (firstTimeVisiting) {
            map.openPopup(
              Leaflet.popup()
                .setLatLng(polygonBounds.getCenter())
                .setContent(
                  "Only Tweets issued from inside of this bounding box are considered",
                ),
            )
          }

          map.pm.addControls({
            drawMarker: false,
            drawPolyline: false,
            drawCircle: false,
            drawCircleMarker: false,
            editMode: false,
            dragMode: false,
            cutPolygon: false,
            removalMode: false,
            rotateMode: false,
          })
        }
      },
      { flush: "post" },
    )

    return () =>
      indexedBoundingBox.value ? (
        <>
          <div id="map" class="h-full"></div>
          <NModal
            class="w-[800px]"
            transformOrigin="center"
            v-model={[showDistribModal.value, "show"]}
            onAfterLeave={handleDistribModalLeft}
          >
            <NCard
              title={`Tweets Distribution of That Area Over the Last ${distribLengthInHrs} Hours`}
              v-slots={{
                action: () => (
                  <div class="flex justify-center">
                    <NButton
                      type="primary"
                      disabled={!tweetsDistrib.value}
                      onClick={gainInights}
                    >
                      Gain Insights
                    </NButton>
                  </div>
                ),
              }}
            >
              {tweetsDistrib.value ? (
                <>
                  <canvas ref={tweetsDistribCanvas}></canvas>
                  <NH3>Match Tweets Against</NH3>
                  <div class="flex gap-x-2">
                    <NInput
                      placeholder="Text"
                      v-model={[relevantTweetsQuery.text, "value"]}
                    />
                    <NDatePicker
                      type="datetimerange"
                      actions={["confirm"]}
                      isDateDisabled={(timestamp) =>
                        timestamp <
                          relevantTweetsFixedRange[0] -
                            1 * 24 * 60 * 60 * 1000 ||
                        timestamp > relevantTweetsFixedRange[1]
                      }
                      v-model={[relevantTweetsQuery.timestampRange, "value"]}
                    />
                  </div>
                </>
              ) : (
                <NSpin class="flex" />
              )}
            </NCard>
          </NModal>
          <NModal
            class="w-[750px]"
            transformOrigin="center"
            v-model={[showInsightsModal.value, "show"]}
            onAfterLeave={handleInsightsModalLeft}
          >
            <NCard title="Insights">
              {mostRelevantTweets.value ? (
                <NTabs justify-content="space-around">
                  <NTabPane
                    name={`Most ${mostRelevantTweets.value.length} Relevant Tweets`}
                  >
                    <NList class="overflow-y-auto overflow-x-hidden max-h-96">
                      {mostRelevantTweets.value.map(
                        ({ author_username, id, text }) => (
                          <NListItem
                            v-slots={{
                              prefix: () => (
                                <a
                                  href={`https://twitter.com/${author_username}/status/${id}`}
                                  target="_blank"
                                >
                                  <NButton type="info">See in Twitter</NButton>
                                </a>
                              ),
                            }}
                          >
                            <NThing
                              title={author_username}
                              description={text}
                            />
                          </NListItem>
                        ),
                      )}
                    </NList>
                  </NTabPane>
                  <NTabPane name="Word Cloud">
                    <canvas
                      class="h-[500px]"
                      ref={tweetsWordCloudCanvas}
                    ></canvas>
                  </NTabPane>
                </NTabs>
              ) : (
                <NSpin class="flex" />
              )}
            </NCard>
          </NModal>
        </>
      ) : (
        <NSpin class="h-full flex" />
      )

    function handleDistribModalLeft() {
      tweetsDistrib.value = null
      relevantTweetsQuery.text = ""
      relevantTweetsQuery.timestampRange = relevantTweetsFixedRange
      chart.destroy()
      geofencedBoundingBoxLayer.value.remove()
    }

    function gainInights() {
      showInsightsModal.value = true
      fetch(`${API_URL}/most_relevant_tweets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...relevantTweetsQuery,
          maxTweetsNumber: 2500,
        }),
      })
        .then((response) => response.json())
        .then((tweets) => (mostRelevantTweets.value = tweets))
    }

    function handleInsightsModalLeft() {
      mostRelevantTweets.value = null
    }
  },
})
