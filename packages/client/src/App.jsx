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
        [28.9607383366, 33.8670178679],
        [37.4288181659, 33.8035183447],
        [37.5020942135, 48.5407341888],
        [29.041482138, 48.604233712],
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
