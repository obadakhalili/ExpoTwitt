import { createApp } from "vue"
import { NDialogProvider } from "naive-ui"
import "vfonts/Lato.css"

import App from "./App.jsx"
import "./styles.css"

createApp(() => (
  <NDialogProvider>
    <App />
  </NDialogProvider>
)).mount("#app")
