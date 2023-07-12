/**
 *
 * RESOURCES
 *
 **/

/** Declare expected type values */
const corridors = ["None", "All Signage", "Signage Pending", "Signage Ready"];

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
const popularRoutes = [
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
const fuelTypeListEl = document.getElementById("fuel-type-list");
const routesListEl = document.getElementById("route-list");
const routesPanelEl = document.getElementById("route-panel");

/** Create a simple state object and set the default filter to allTypes */
const appState = {
  types: allTypes,
  corridors: "None"
};

/** Not Map Things */
function handleModalChange() {
  modalEl.open = !modalEl.open;
}

/** Layer Resources */
const apiKey =
  "AAPK930915ff5f15456dbbfa77b4ae41c180GXXMr_3eIL9DvdQHcFVasjxNKfbzymMyo6L9N9JGnYvkyP1myvnevJmBoFYLf2DB";

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
import RouteLayer from "https://js.arcgis.com/4.27/@arcgis/core/layers/RouteLayer.js";
import Home from "https://js.arcgis.com/4.27/@arcgis/core/widgets/Home.js";
import Locate from "https://js.arcgis.com/4.27/@arcgis/core/widgets/Locate.js";
import { generalize } from "https://js.arcgis.com/4.27/@arcgis/core/geometry/geometryEngine.js";

esriConfig.portalUrl = "https://jsapi.maps.arcgis.com/";
esriConfig.apiKey = apiKey;

toggleModalEl.addEventListener("click", handleModalChange);
corridorListEl.addEventListener("calciteListChange", handleCorridorListChange);
fuelTypeListEl.addEventListener("calciteListChange", handleFuelTypeListChange);
routesListEl.addEventListener("calciteListChange", handleRoutesListChange);

const initialMapViewOptions = {
  center: [-100, 45],
  zoom: 3
}

const routeLayer = new GraphicsLayer();

const stationRenderer = {
  field: "Fuel_Type",
  type: "unique-value",
  uniqueValueInfos: assignColorsToTypes(),
};

function assignColorsToTypes() {
  return allTypes.map((type, index) =>
    ({
        value: type.code,
        symbol: {
          type: "simple-marker",
          size: 2,
          color: typeColors[index],
          outline: { color: typeColors[index], width: 1 },
        }
      }
    ));
}

const stationLayer = new FeatureLayer({
  url: alternativeFuelLayerURL,
  outFields: ["Fuel_Type"],
  minScale: 0,
  maxScale: 0,
  renderer: stationRenderer,
});

const corridorLayer = new FeatureLayer({
  url: alternativeFuelCorridorURL,
  outFields: ["ELECTRICVE"],
  minScale: 0,
  maxScale: 0,
});

const map = new Map({
  basemap: "streets-night-vector",
  layers: [corridorLayer, stationLayer, routeLayer],
});

const view = new MapView({
  container: "viewDiv",
  map,
  ...initialMapViewOptions
});

const locateWidget = new Locate({ view });
const homeWidget = new Home({ view });

view.ui.add([homeWidget, locateWidget], "top-left");
view.padding.left = 340;

function createCorridorListItems() {
  corridors.forEach(item => {
    const listItem = document.createElement("calcite-list-item");
    listItem.label = item;
    listItem.selected = item === appState.corridors;
    corridorListEl.append(listItem);
  });
}

function createFuelTypeListItems() {
  allTypes.forEach((item, index) => {
    const listItem = document.createElement("calcite-list-item");
    listItem.label = item.name;
    listItem.value = item.code;
    listItem.selected = true;
    fuelTypeListEl.append(listItem);
  });
}

async function createPopularRoutesLayers() {
  const solvedRoutes = popularRoutes.map(async route => {
    const listItem = document.createElement("calcite-list-item");
    listItem.label = route.name;
    routesListEl.append(listItem);

    const drive = new RouteLayer({
      name: route.name,
      stops: route.stops,
      effect: "bloom(1, 0.15px, 0)"
    });

    const results = await drive.solve();
    drive.update(results);
    drive.visible = false;
    map.add(drive);
  });

  await Promise.all(solvedRoutes);
  routesPanelEl.disabled = false;
  routesPanelEl.loading = false;
}

async function handleCorridorListChange(event) {
  const corridorType = event.target.selectedItems[0]?.label;
  appState.corridors = corridorType;
  updateCorridorFilter();
}

async function updateCorridorFilter() {
  const featureLayerView = await view.whenLayerView(corridorLayer);

  featureLayerView.filter = {
    where: createCorridorWhereClause()
  };
}

function createCorridorWhereClause() {
  const corridorType = appState.corridors;
  return corridorType === "None" ? "1 = 0" :
         corridorType === "All Signage" ? "1 = 1" :
         `ELECTRICVE = '${corridorType}'`
}

function handleFuelTypeListChange(event) {
  const selectedItems = event.target.selectedItems;
  const items = selectedItems.map(item => ({ name: item.label, code: item.value }));
  appState.types = items;
  updateFuelTypeFilter();
}

async function updateFuelTypeFilter() {
  const featureLayerView = await view.whenLayerView(stationLayer);

  featureLayerView.filter = {
    where: createFuelTypeWhereClause()
  };
}

function createFuelTypeWhereClause() {
  const typesActive = appState.types.length > 0;
  const featureTypes = typesActive ? appState.types : allTypes;
  const fuelTypes = featureTypes.map(type => `'${type.code}'`);
  const showSelected = `Fuel_Type = ${fuelTypes.join(" OR Fuel_Type = ")}`;
  return typesActive ? showSelected : `NOT (${showSelected})`;
}

function handleRoutesListChange(event) {
  const selectedRouteName = event.target.selectedItems[0]?.label;
  let selectedRouteLayer;

  map.layers
    .filter(layer => layer.type === "route")
    .forEach(layer => {
      const matched = layer.name === selectedRouteName;
      if (!matched) {
        layer.visible = false;
      }
      else if (!layer.visible) {
        layer.visible = true;
        selectedRouteLayer = layer;
      }
    });

  highlightFuelStationsAlongRoute(selectedRouteLayer);
}

async function highlightFuelStationsAlongRoute(routeLayer) {
  const featureLayerView = await view.whenLayerView(stationLayer);

  if (routeLayer) {
    featureLayerView.featureEffect = {
      filter: {
        geometry: generalize(routeLayer.routeInfo.geometry, 0.5, true),
        distance: 50,
        units: "miles"
      },
      excludedEffect: "grayscale(75%) opacity(15%)"
    };

    view.goTo(routeLayer.fullExtent.clone().expand(2));
  }
  else {
    featureLayerView.featureEffect =  null;
    view.goTo(initialMapViewOptions);
  }
}

function init() {
  createCorridorListItems();
  createFuelTypeListItems();
  createPopularRoutesLayers();
  updateCorridorFilter()
  updateFuelTypeFilter();
}

init();
