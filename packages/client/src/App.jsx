import { defineComponent, ref, watchEffect, onMounted } from "vue"
import { NSpin } from "naive-ui"
import Leaflet from "leaflet"
import "@geoman-io/leaflet-geoman-free"
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css"
import "leaflet/dist/leaflet.css"

export default defineComponent({
  name: "App",
  setup: () => {
    onMounted(() => document.getElementById("app").classList.add("h-screen"))

    const indexedBoundingBox = ref()

    fetch(
      `${
        import.meta.env.VITE_ExpoTwitt_API_URL || "/api"
      }/interest_bounding_box`,
    )
      .then((response) => response.json())
      .then(({ GeoJSON }) => (indexedBoundingBox.value = GeoJSON))

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
            {
              color: "#4098FC",
              fill: false,
            },
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
                .setLatLng(polygonBounds.getNorthWest())
                .setContent(
                  "Only Tweets issued from inside of this bounding box are considered",
                ),
            )
            .on("pm:create", (event) => console.log(event.layer.toGeoJSON()))

          map.pm.addControls({
            drawMarker: false,
            drawPolyline: false,
            drawCircleMarker: false,
            cutPolygon: false,
          })
        }
      },
      { flush: "post" },
    )

    return () =>
      indexedBoundingBox.value ? (
        <div id="map" class="h-full"></div>
      ) : (
        <NSpin class="h-full flex" />
      )
  },
})
