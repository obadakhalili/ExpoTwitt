import { defineComponent, ref, watchEffect, onMounted, reactive } from "vue"
import {
  NSpin,
  NModal,
  NCard,
  NButton,
  NInput,
  NDatePicker,
  NH3,
} from "naive-ui"
import Leaflet from "leaflet"
import {
  Chart,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
} from "chart.js"
import "@geoman-io/leaflet-geoman-free"
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css"
import "leaflet/dist/leaflet.css"

const API_URL = import.meta.env.VITE_ExpoTwitt_API_URL || "/api"

Chart.register(BarController, BarElement, LinearScale, CategoryScale)

export default defineComponent({
  name: "App",
  setup: () => {
    onMounted(() => document.getElementById("app").classList.add("h-screen"))

    const indexedBoundingBox = ref()
    const geofencedBoundingBoxLayer = ref()
    const showDistribModal = ref(false)
    const tweetsDistrib = ref()
    const tweetsDistribCanvas = ref()
    const distribLengthInHrs = 120
    const now = Date.now()
    const insightsQuery = reactive({
      text: "",
      timestampRange: [now - distribLengthInHrs * 60 * 60 * 1000, now],
    })
    let chart

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
            .openPopup(
              Leaflet.popup()
                .setLatLng(polygonBounds.getCenter())
                .setContent(
                  "Only Tweets issued from inside of this bounding box are considered",
                ),
            )
            .on("pm:create", ({ layer }) => {
              geofencedBoundingBoxLayer.value = layer
              showDistribModal.value = true
              insightsQuery.boundingBox = layer.toGeoJSON().geometry

              fetch(`${API_URL}/tweets_distrib`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  hours: distribLengthInHrs,
                  boundingBox: insightsQuery.boundingBox,
                }),
              })
                .then((response) => response.json())
                .then(({ distrib }) => (tweetsDistrib.value = distrib))
            })

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
            class="w-[700px]"
            transformOrigin="center"
            v-model={[showDistribModal.value, "show"]}
            onAfterLeave={handleDistribModalLeft}
          >
            <NCard
              title={`Tweets distribution of that area over the last ${distribLengthInHrs} hours`}
              v-slots={{
                default: () =>
                  tweetsDistrib.value ? (
                    <>
                      <canvas ref={tweetsDistribCanvas}></canvas>
                      <NH3>Match tweets against</NH3>
                      <div class="flex gap-x-2">
                        <NInput
                          placeholder="Text"
                          v-model={[insightsQuery.text, "value"]}
                        />
                        <NDatePicker
                          type="datetimerange"
                          actions={["confirm"]}
                          isDateDisabled={(timestamp) =>
                            timestamp <
                              insightsQuery.timestampRange[0] -
                                1 * 24 * 60 * 60 * 1000 ||
                            timestamp > insightsQuery.timestampRange[1]
                          }
                          v-model={[insightsQuery.timestampRange, "value"]}
                        />
                      </div>
                    </>
                  ) : (
                    <NSpin class="flex" />
                  ),
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
            />
          </NModal>
        </>
      ) : (
        <NSpin class="h-full flex" />
      )

    function handleDistribModalLeft() {
      chart.destroy()
      geofencedBoundingBoxLayer.value.remove()
      tweetsDistrib.value = null
    }

    function gainInights() {
      console.log("Gain insights")
    }
  },
})
