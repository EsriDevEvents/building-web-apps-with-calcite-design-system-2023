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
const body = document.querySelector("body");
const chipGroupEl = document.getElementById("theme-chips");

const lavenderBasemap = new Basemap({
  baseLayers: [
    new VectorTileLayer({
      portalItem: { id: "b163970539704b46b126547f0f8279f6" },
    }),
  ],
});

const rangerBasemap = new Basemap({
  baseLayers: [
    new VectorTileLayer({
      portalItem: { id: "5151c8965866478c93b847fe30ce49fb" },
    }),
  ],
});

const mintBasemap = new Basemap({
  baseLayers: [
    new VectorTileLayer({
      portalItem: { id: "85a1850262844350a4a8a9623694ff9e" },
    }),
  ],
});

chipGroupEl.addEventListener("calciteChipGroupSelect", (event) => {
  const themeName = event.target.selectedItems[0].value;
  body.className = themeName;
  switch (themeName) {
    case "lavender":
      map.basemap = lavenderBasemap;
      break;
    case "ranger":
      map.basemap = rangerBasemap;
      break;
    case "mint":
      map.basemap = mintBasemap;
      break;
    default:
      map.basemap = "streets-night-vector";
  }
  console.log({ themeName }, body);
});

/** Create a simple state object and set the default filter to allTypes */
const appState = {
  types: allTypes,
  corridors: "None",
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
import Portal from "https://js.arcgis.com/4.27/@arcgis/core/portal/Portal.js";
import Basemap from "https://js.arcgis.com/4.27/@arcgis/core/Basemap.js";
import VectorTileLayer from "https://js.arcgis.com/4.27/@arcgis/core/layers/VectorTileLayer.js";

esriConfig.portalUrl = "https://jsapi.maps.arcgis.com/";
esriConfig.apiKey = apiKey;
toggleModalEl.addEventListener("click", handleModalChange);

corridorListEl.addEventListener("calciteListChange", handleCorridorListChange);

filterListEl.addEventListener("calciteListChange", handleStationTypeListChange);

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
});

const map = new Map({
  basemap: "streets-night-vector",
  layers: [corridorLayer, stationLayer, routeLayer],
});

const view = new MapView({
  container: "viewDiv",
  map,
  center: [-100, 45],
  zoom: 3,
});

function resetMap() {
  map.layers
    .filter((layer) => layer.name)
    .forEach((layer) => layer.visible = false);
  view.goTo({ center: [-100, 45], zoom: 3 });
}

const suggestedRouteListItems = [];

async function createSuggestedRoutesLayers() {
  const portal = Portal.getDefault();
  await portal.load();

  suggestedRoutes.forEach(async (route, index) => {
    const listItem = document.createElement("calcite-list-item");
    listItem.label = route.name;
    listItem.addEventListener("calciteListItemSelect", handleRouteDisplay);
    if (!suggestedRouteListItems.includes(listItem)) {
      suggestedRouteListItems.push(listItem);
    }

    routesListEl.append(listItem);

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

const locateWidget = new Locate({ view });
const homeWidget = new Home({ view });

view.ui.add([homeWidget, locateWidget], "top-left");
view.padding.left = 383;

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
    filterListEl.append(listItem);
  });
}

function createCorridorListItems() {
  corridors.forEach((item) => {
    const listItem = document.createElement("calcite-list-item");
    listItem.label = item;
    listItem.selected = item === appState.corridors;
    corridorListEl.append(listItem);
  });
}

function createStationWhereClause() {
  const typesActive = appState.types.length > 0;
  const featureTypes = typesActive ? appState.types : allTypes;
  const fuelTypes = featureTypes.map((type) => (`'${type.code}'`));
  const filtered = ` AND (Fuel_Type = ${fuelTypes.join(" OR Fuel_Type = ")})`;
  const unfiltered = ` AND Fuel_Type != ${fuelTypes.join(" AND Fuel_Type != ")}`;
  return typesActive ? filtered : unfiltered;
}

async function handleStationFilter() {
  const featureLayerView = await view.whenLayerView(stationLayer);
  const where = `Fuel_Type IS NOT NULL${createStationWhereClause()}`;
  featureLayerView.featureEffect = {
    filter: { where },
    excludedEffect: "opacity(0%)",
    includedEffect: "opacity(100%)",
  };
}

function handleStationTypeListChange(event) {
  const items = event.target.selectedItems.map((item) => ({ name: item.label, code: item.value }));
  appState.types = items;
  handleStationFilter();
}


async function handleCorridorListChange(event) {
  const corridorType = event.target.selectedItems[0]?.label;
  appState.corridors = corridorType;
  handleCorridorFilter(corridorType);
}

async function handleCorridorFilter(corridorType) {
  const featureLayerView = await view.whenLayerView(corridorLayer);

  featureLayerView.filter = corridorType === "None" ? null : {
    where: `ELECTRICVE = '${corridorType}'`
  };

  featureLayerView.featureEffect = {
    excludedEffect: "opacity(0%)",
    includedEffect: "opacity(100%)",
  };
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
}

createFilterListItems();
createCorridorListItems();
handleStationFilter();
createSuggestedRoutesLayers();

function updatePrism() {
  window.setTimeout(() => Prism?.highlightAll(), 500);
}
document.body.addEventListener("calciteStepperItemChange", updatePrism);
window.onload = () => updatePrism();
