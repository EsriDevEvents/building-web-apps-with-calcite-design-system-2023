/**
 *
 * RESOURCES
 *
 **/

/** Declare expected type values */
const corridors = ["Signage Pending", "Signage Ready"];

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
// todo - more colors
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
const suggestedRoutesListEl = document.getElementById("route-list");
const customRouteEl = document.getElementById("custom-route-button");
const routeScrim = document.getElementById("route-scrim");

/** Create a simple state object and set the default filter to allTypes */
const appState = {
  types: allTypes,
  corridors: false,
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

const routeUrl =
  "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
const alternativeFuelLayerURL =
  "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Alternate_Fuel/FeatureServer/0";
const alternativeFuelCorridorURL =
  "https://services1.arcgis.com/4yjifSiIG17X0gW4/arcgis/rest/services/Alternative_Fuel_Corridors/FeatureServer/2";

/**
 *
 * MAPS SDK
 *
 **/
require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Home",
  "esri/widgets/Locate",
  "esri/layers/GraphicsLayer",
  "esri/layers/RouteLayer",
], (
  esriConfig,
  Map,
  MapView,
  FeatureLayer,
  Home,
  Locate,
  GraphicsLayer,
  RouteLayer
) =>
  (async () => {
    esriConfig.apiKey = apiKey;
    toggleModalEl.addEventListener("click", () => handleModalChange());
    customRouteEl.addEventListener("click", () => handleCreateCustomRoute());

    corridorListEl.addEventListener("calciteListChange", () => {
      handleCorridorListChange();
    });
    filterListEl.addEventListener("calciteListChange", (event) =>
      handleStationTypeListChange(event)
    );

    const customRenderer = {
      field: "Fuel_Type",
      type: "unique-value",
      uniqueValueInfos: assignColorsToTypes(),
    };

    const routeLayer = new GraphicsLayer();

    const layer = new FeatureLayer({
      url: alternativeFuelLayerURL,
      outFields: ["*"],
      minScale: 0,
      maxScale: 0,
      renderer: customRenderer,
    });

    const corridorLayer = new FeatureLayer({
      url: alternativeFuelCorridorURL,
      outFields: ["*"],
      minScale: 0,
      maxScale: 0,
      visible: false,
    });

    const map = new Map({
      basemap: "streets-night-vector",
      layers: [corridorLayer, layer, routeLayer],
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

    function createSuggestedRoutesLayers() {
      suggestedRoutes.forEach((route, index) => {
        const listItem = document.createElement("calcite-list-item");
        listItem.label = route.name;
        listItem.addEventListener("calciteListItemSelect", (event) =>
          handleRouteDisplay(event)
        );
        if (!suggestedRouteListItems.includes(listItem))
          suggestedRouteListItems.push(listItem);

        suggestedRoutesListEl.appendChild(listItem);

        const drive = new RouteLayer({
          name: route.name,
          stops: route.stops,
          effect: "bloom(1, 0.15px, 0)",
        });

        drive.solve().then((results) => {
          drive.update(results);
          drive.visible = false;
          map.add(drive);
          if (index > 3) {
            routeScrim.hidden = true;
            routeScrim.loading = false;
          }
        });
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
      allTypes.forEach((item, index) => {
        const listItem = document.createElement("calcite-list-item");
        listItem.label = item.name;
        listItem.value = item.code;
        listItem.style.setProperty(
          "--calcite-ui-icon-color",
          typeColors[index]
        );
        listItem.style.setProperty(
          "--calcite-ui-focus-color",
          typeColors[index]
        );
        listItem.selected = true;
        filterListEl.appendChild(listItem);
      });
    }

    function createCorridorListItems() {
      corridors.forEach((item) => {
        const listItem = document.createElement("calcite-list-item");
        listItem.label = item;
        corridorListEl.appendChild(listItem);
      });
    }

    function createWhereArguments() {
      let args = [];
      const typesActive = appState.types.length > 0;
      const featureTypes = typesActive ? appState.types : allTypes;
      featureTypes.forEach((j) => args.push(`'${j.code}'`));
      const filtered = ` AND (Fuel_Type = ${args.join(" OR Fuel_Type = ")})`;
      const unfiltered = ` AND Fuel_Type != ${args.join(" AND Fuel_Type != ")}`;
      const argString = typesActive ? filtered : unfiltered;
      return argString;
    }

    async function handleLayerFilter() {
      await view.whenLayerView(layer).then((featureLayerView) => {
        const where = `Fuel_Type IS NOT NULL${createWhereArguments()}`;
        featureLayerView.featureEffect = {
          filter: { where },
          excludedEffect: "opacity(0%)",
          includedEffect: "opacity(100%)",
        };
      });
    }

    function handleStationTypeListChange(event) {
      let items = [];
      event.target.selectedItems.forEach((item) =>
        items.push({ name: item.label, code: item.value })
      );
      appState.types = items;
      handleLayerFilter();
    }

    function handleCorridorListChange() {
      appState.corridor = !appState.corridor;
      corridorLayer.visible = appState.corridor;
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

    function initializeApp() {
      createFilterListItems();
      createCorridorListItems();
      handleLayerFilter();
      createSuggestedRoutesLayers();
    }

    initializeApp();
  })());
