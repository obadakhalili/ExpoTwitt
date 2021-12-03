import { defineComponent, ref, watchEffect, onMounted } from "vue"
import { NSpin } from "naive-ui"
import Leaflet from "leaflet"
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

          const map = Leaflet.map("map").setView(polygonBounds.getCenter(), 1)

          Leaflet.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
          ).addTo(map)

          polygon.addTo(map)

          Leaflet.popup()
            .setLatLng(polygonBounds.getNorthWest())
            .setContent(
              "Only Tweets issued from inside of this bounding box are considered",
            )
            .openOn(map)

          map.fitBounds(polygonBounds)
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
