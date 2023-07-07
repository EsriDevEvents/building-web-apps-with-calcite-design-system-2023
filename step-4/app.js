/**
 *
 * RESOURCES
 *
 **/

/** Declare expected type values */
const corridors = ["None", "Signage Pending", "Signage Ready"];

/** Declare expected type values */
const allTypes = [
  {
    name: "Biodiesel (B20 and above)",
    code: "BD",
  },
  {
    name: "Compressed Natural Gas (CNG)",
    code: "CNG",
  },
  {
    name: "Electric",
    code: "ELEC",
  },
  {
    name: "Ethanol (E85)",
    code: "E85",
  },
  {
    name: "Hydrogen",
    code: "HY",
  },
  {
    name: "Liquefied Natural Gas (LNG)",
    code: "LNG",
  },
  {
    name: "Propane (LPG)",
    code: "LPG",
  },
  {
    name: "Renewable Diesel (R20 and above)",
    code: "RD",
  },
];

/** Declare expected type values */
const suggestedRoutes = [
  {
    name: "New York to Los Angeles",
    stops: [
      { geometry: { type: "point", x: -118.2437, y: 34.0522 } },
      { geometry: { type: "point", x: -74.006, y: 40.7128 } },
    ],
  },
  {
    name: "Boston to Washington D.C.",
    stops: [
      { geometry: { type: "point", x: -71.0589, y: 42.3601 } },
      { geometry: { type: "point", x: -77.0369, y: 38.9072 } },
    ],
  },
  {
    name: "Seattle to Chicago",
    stops: [
      { geometry: { type: "point", x: -122.3321, y: 47.6062 } },
      { geometry: { type: "point", x: -87.6298, y: 41.8781 } },
    ],
  },
  {
    name: "Phoenix to Denver",
    stops: [
      { geometry: { type: "point", x: -112.074, y: 33.4484 } },
      { geometry: { type: "point", x: -104.9903, y: 39.7392 } },
    ],
  },
  {
    name: "San Francisco to St. Louis",
    stops: [
      { geometry: { type: "point", x: -122.4194, y: 37.7749 } },
      { geometry: { type: "point", x: -90.1994, y: 38.627 } },
    ],
  },
];

/** Declare  colors to assign to each type - these will also be used in CSS */
const typeColors = [
  "#f3413d",
  "#e38c0e",
  "#dce30e",
  "#43e30e",
  "#0ee388",
  "#0ec0e3",
  "#9f8ff0",
  "#f072d2",
];

/** Declare element variables */
const toggleModalEl = document.getElementById("toggle-modal");
const modalEl = document.getElementById("modal");
const corridorListEl = document.getElementById("corridor-list");
const filterListEl = document.getElementById("filter-list");
const routesListEl = document.getElementById("route-list");
const routesPanelEl = document.getElementById("route-panel");
const customRouteEl = document.getElementById("custom-route-button");
const body = document.querySelector("body");
const chipGroupEl = document.getElementById("theme-chips");

const rangerStyle =
  "https://esriinc.maps.arcgis.com/sharing/rest/content/items/c5f34b0301a44cd2a0f95823608a3c34/resources/styles/root.json";

let vectormap = new VectorTileLayer(
  "https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer"
);

chipGroupEl.addEventListener("calciteChipGroupSelect", (event) => {
  body.classList = event.target.selectedItems[0].value;
  console.log(event.target.selectedItems[0].value);
  switch (event.target.selectedItems[0].value) {
    case "lavender":
      map.basemap = "c5f34b0301a44cd2a0f95823608a3c34";
      break;
    case "ranger":
      map.basemap = vectormap;
      vectormap.setStyle(rangerStyle);
      break;
    case "mint":
      map.basemap = "osm-standard-relief";
      break;
    default:
      map.basemap = "streets-night-vector";
  }
});

/** Create a simple state object and set the default filter to allTypes */
const appState = {
  types: allTypes,
  corridors: "None",
  creatingCustomRouteCurrently: false,
  suggestedRoutesHaveLoaded: false,
};

/** Not Map Things */
function handleModalChange() {
  modalEl.open = !modalEl.open;
}

/** Layer Resources */
const apiKey =
  "AAPK930915ff5f15456dbbfa77b4ae41c180GXXMr_3eIL9DvdQHcFVasjxNKfbzymMyo6L9N9JGnYvkyP1myvnevJmBoFYLf2DB";

// const routeUrl =
//   "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

const alternativeFuelLayerURL =
  "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Alternate_Fuel/FeatureServer/0";
const alternativeFuelCorridorURL =
  "https://services1.arcgis.com/4yjifSiIG17X0gW4/arcgis/rest/services/Alternative_Fuel_Corridors/FeatureServer/2";

/**
 *
 * MAPS SDK
 *
 **/
import esriConfig from "https://js.arcgis.com/4.27/@arcgis/core/config.js";
import Map from "https://js.arcgis.com/4.27/@arcgis/core/Map.js";
import MapView from "https://js.arcgis.com/4.27/@arcgis/core/views/MapView.js";
import FeatureLayer from "https://js.arcgis.com/4.27/@arcgis/core/layers/FeatureLayer.js";
import GraphicsLayer from "https://js.arcgis.com/4.27/@arcgis/core/layers/GraphicsLayer.js";
import VectorTileLayer from "https://js.arcgis.com/4.27/@arcgis/core/layers/VectorTileLayer.js";

import RouteLayer from "https://js.arcgis.com/4.27/@arcgis/core/layers/RouteLayer.js";
import Home from "https://js.arcgis.com/4.27/@arcgis/core/widgets/Home.js";
import Locate from "https://js.arcgis.com/4.27/@arcgis/core/widgets/Locate.js";

esriConfig.portalUrl = "https://jsapi.maps.arcgis.com/";
esriConfig.apiKey = apiKey;
toggleModalEl.addEventListener("click", () => handleModalChange());
customRouteEl.addEventListener("click", () => handleCreateCustomRoute());

corridorListEl.addEventListener("calciteListChange", (event) => {
  handleCorridorListChange(event);
});

filterListEl.addEventListener("calciteListChange", (event) =>
  handleStationTypeListChange(event)
);

const routeLayer = new GraphicsLayer();

const stationRenderer = {
  field: "Fuel_Type",
  type: "unique-value",
  uniqueValueInfos: assignColorsToTypes(),
};

const stationLayer = new FeatureLayer({
  url: alternativeFuelLayerURL,
  outFields: ["*"],
  minScale: 0,
  maxScale: 0,
  renderer: stationRenderer,
});

const corridorLayer = new FeatureLayer({
  url: alternativeFuelCorridorURL,
  outFields: ["*"],
  minScale: 0,
  maxScale: 0,
  // visible: false,
});

const map = new Map({
  basemap: "streets-night-vector",
  layers: [corridorLayer, stationLayer, routeLayer],
});

const view = new MapView({
  container: "viewDiv",
  map: map,
  center: [-100, 45],
  zoom: 3,
});

function resetMap() {
  map.layers
    .filter((layer) => layer.name)
    .forEach((layer) => {
      layer.visible = false;
    });
  view.goTo({ center: [-100, 45], zoom: 3 });
}

const suggestedRouteListItems = [];

async function createSuggestedRoutesLayers() {
  suggestedRoutes.forEach(async (route, index) => {
    const listItem = document.createElement("calcite-list-item");
    listItem.label = route.name;
    listItem.addEventListener("calciteListItemSelect", (event) =>
      handleRouteDisplay(event)
    );
    if (!suggestedRouteListItems.includes(listItem))
      suggestedRouteListItems.push(listItem);

    routesListEl.appendChild(listItem);

    const drive = new RouteLayer({
      name: route.name,
      stops: route.stops,
      effect: "bloom(1, 0.15px, 0)",
    });

    const results = await drive.solve();
    drive.update(results);
    drive.visible = false;
    map.add(drive);

    if (index > 3) {
      routesPanelEl.disabled = false;
      routesPanelEl.loading = false;
    }
  });
}

const locateBtn = new Locate({ view: view });
const homeWidget = new Home({ view: view });

view.ui.add(homeWidget, "top-left");
view.ui.add(locateBtn, { position: "top-left" });

function assignColorsToTypes() {
  let uniqueValueInfos = [];
  allTypes.forEach((type, index) => {
    uniqueValueInfos.push({
      value: type.code,
      symbol: {
        type: "simple-marker",
        size: 2,
        color: typeColors[index],
        outline: { color: typeColors[index], width: 1 },
      },
    });
  });
  return uniqueValueInfos;
}

function createFilterListItems() {
  const iconProp = "--calcite-ui-icon-color";
  const focusProp = "--calcite-ui-focus-color";
  allTypes.forEach((item, index) => {
    const listItem = document.createElement("calcite-list-item");
    listItem.label = item.name;
    listItem.value = item.code;
    const style = listItem.style;
    style.setProperty(iconProp, typeColors[index]);
    style.setProperty(focusProp, typeColors[index]);
    listItem.selected = true;
    filterListEl.appendChild(listItem);
  });
}

function createCorridorListItems() {
  corridors.forEach((item) => {
    const listItem = document.createElement("calcite-list-item");
    listItem.label = item;
    listItem.selected = item === appState.corridors;
    corridorListEl.appendChild(listItem);
  });
}

function createStationWhereArguments() {
  let args = [];
  const typesActive = appState.types.length > 0;
  const featureTypes = typesActive ? appState.types : allTypes;
  featureTypes.forEach((j) => args.push(`'${j.code}'`));
  const filtered = ` AND (Fuel_Type = ${args.join(" OR Fuel_Type = ")})`;
  const unfiltered = ` AND Fuel_Type != ${args.join(" AND Fuel_Type != ")}`;
  const argString = typesActive ? filtered : unfiltered;
  return argString;
}

async function handleStationFilter() {
  const featureLayerView = await view.whenLayerView(stationLayer);
  const where = `Fuel_Type IS NOT NULL${createStationWhereArguments()}`;
  featureLayerView.featureEffect = {
    filter: { where },
    excludedEffect: "opacity(0%)",
    includedEffect: "opacity(100%)",
  };
}

function handleStationTypeListChange(event) {
  let items = [];
  event.target.selectedItems.forEach((item) =>
    items.push({ name: item.label, code: item.value })
  );
  appState.types = items;
  handleStationFilter();
}

async function handleCorridorFilter(requestedValue) {
  const featureLayerView = await view.whenLayerView(corridorLayer);

  // console.log(corridorLayer);
  // const where = `EV IS NOT NULL`;
  featureLayerView.featureEffect = {
    // filter: { where },
    excludedEffect: "opacity(0%)",
    includedEffect: "opacity(100%)",
  };
}

async function handleCorridorListChange(event) {
  const requestedValue = event.target.selectedItems[0]?.label;
  handleCorridorFilter(requestedValue);
}

function handleRouteDisplay(event) {
  const route = suggestedRoutes.find(
    (route) => route.name === event.target.label
  );

  map.layers
    .filter((layer) => layer.name)
    .forEach((layer) => {
      const isMatch = layer.name === route.name;
      if (!isMatch) {
        layer.visible = false;
      } else if (isMatch && !layer.visible) {
        layer.visible = true;
        const extent = layer.fullExtent.clone();
        view.goTo(extent.expand(2));
      } else if (isMatch) {
        resetMap();
      }
    });
  // Need to filter station features to a buffer defined by user via slider /default
}

function handleCreateCustomRoute() {
  /*
      // More or less working
      // Need to style route and symbols of this and other route
      // Need to limit stops to 2, add Notice with directions when in editing mode
      // Need to allow cancellation and disable all sidebars while editing
      // Need to add a FAB for stop drawing

      const originalState = appState.creatingCustomRouteCurrently;
      resetMap();
      suggestedRouteListItems.forEach((listItem) => {
        listItem.disabled = !originalState;
        listItem.selected = false;
      });

      customRouteEl.kind = !originalState ? "brand" : "neutral";

      if (!originalState) {
        const routeParams = new RouteParameters({
          apiKey,
          stops: new FeatureSet(),
          outSpatialReference: {
            wkid: 3857,
          },
        });

        const stopSymbol = {
          type: "simple-marker",
          style: "cross",
          size: 15,
          outline: {
            width: 4,
          },
        };

        const routeSymbol = {
          type: "simple-line",
          color: [0, 0, 255, 0.5],
          width: 5,
        };

        view.on("click", addStop);

        function addStop(event) {
          const stop = new Graphic({
            geometry: event.mapPoint,
            symbol: stopSymbol,
          });
          routeLayer.add(stop);

          routeParams.stops.features.push(stop);
          if (routeParams.stops.features.length >= 2) {
            route.solve(routeUrl, routeParams).then(showRoute);
          }
        }
        function showRoute(data) {
          const routeResult = data.routeResults[0].route;
          routeResult.symbol = routeSymbol;
          routeLayer.add(routeResult);
        }
      }

      appState.creatingCustomRouteCurrently = !originalState;
      */
}

createFilterListItems();
createCorridorListItems();
handleStationFilter();
createSuggestedRoutesLayers();

window.onload = () => window.setTimeout(() => Prism?.highlightAll(), 500);
