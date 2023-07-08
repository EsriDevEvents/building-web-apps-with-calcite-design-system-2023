/**
 *
 * RESOURCES
 *
 **/

/** Declare element variables */
const toggleModalEl = document.getElementById("toggle-modal");
const modalEl = document.getElementById("modal");

/** Not Map Things */
function handleModalChange() {
  modalEl.open = !modalEl.open;
}

/** Layer Resources */
const apiKey =
  "AAPK930915ff5f15456dbbfa77b4ae41c180GXXMr_3eIL9DvdQHcFVasjxNKfbzymMyo6L9N9JGnYvkyP1myvnevJmBoFYLf2DB";

/**
 *
 * MAPS SDK
 *
 **/
import esriConfig from "https://js.arcgis.com/4.27/@arcgis/core/config.js";
import Map from "https://js.arcgis.com/4.27/@arcgis/core/Map.js";
import MapView from "https://js.arcgis.com/4.27/@arcgis/core/views/MapView.js";
import Home from "https://js.arcgis.com/4.27/@arcgis/core/widgets/Home.js";
import Locate from "https://js.arcgis.com/4.27/@arcgis/core/widgets/Locate.js";

esriConfig.portalUrl = "https://jsapi.maps.arcgis.com/";
esriConfig.apiKey = apiKey;


const map = new Map({
  basemap: "streets-night-vector",
});

const view = new MapView({
  container: "viewDiv",
  map,
  center: [-100, 45],
  zoom: 3,
});

const locateBtn = new Locate({ view });
const homeWidget = new Home({ view });

view.ui.add(homeWidget, "top-left");
view.ui.add(locateBtn, { position: "top-left" });
