import { defineComponent, onMounted } from "vue"
import Leaflet from "leaflet"
import "leaflet/dist/leaflet.css"

export default defineComponent({
  name: "App",
  setup: () => {
    onMounted(() => {
      document.getElementById("app").classList.add("h-screen")

      // A bounding box coordinates that wraps around Bilad Al-Sham areas
      const indexedBoundingBox = [
        [29.0322226602, 33.8601651042],
        [29.0322226602, 49.1531325131],
        [37.456605072, 49.1531325131],
        [37.456605072, 33.8601651042],
      ]

      const polygon = L.polygon(indexedBoundingBox, {
        color: "#4098FC",
        fill: false,
      })
      const polygonBounds = polygon.getBounds()

      const map = Leaflet.map("map").setView(polygonBounds.getCenter(), 1)

      Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      polygon.addTo(map)

      map.fitBounds(polygonBounds)
    })

    return () => <div id="map" class="h-full"></div>
  },
})
