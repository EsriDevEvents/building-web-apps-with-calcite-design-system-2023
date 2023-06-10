/** Declare element variables */
const toggleModalEl = document.getElementById("toggle-modal");
const modalEl = document.getElementById("modal");
const corridorListEl = document.getElementById("corridor-list");
const filterListEl = document.getElementById("filter-list");

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

/** Declare  colors to assign to each type - these will also be used in CSS */
// todo - more colors
const typeColors = [
  "#e30e0e",
  "#e38c0e",
  "#dce30e",
  "#43e30e",
  "#0ee388",
  "#0ec0e3",
  "#0e34e3",
  "#720ee3",
];

/** Create a simple state object and set the default filter to allTypes */
const appState = {
  types: allTypes,
  corridors: false,
};

/** Maps SDK */
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Home",
  "esri/widgets/Locate",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/rest/route",
  "esri/rest/support/RouteParameters",
  "esri/rest/support/FeatureSet",
  "esri/request",
], (
  Map,
  MapView,
  FeatureLayer,
  Home,
  Locate,
  Graphic,
  GraphicsLayer,
  route,
  RouteParameters,
  FeatureSet,
  esriRequest
) =>
  (async () => {
    toggleModalEl.addEventListener("click", () => handleModalChange());
    corridorListEl.addEventListener("calciteListChange", () => {
      handleCorridorListChange();
    });
    filterListEl.addEventListener("calciteChipGroupSelect", (event) =>
      handleFilterChipChange(event)
    );

    const customRenderer = {
      field: "Fuel_Type",
      type: "unique-value",
      uniqueValueInfos: assignColorsToTypes(),
    };

    // Point the URL to a valid routing service
    const routeUrl =
      "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

    // The stops and route result will be stored in this layer
    const routeLayer = new GraphicsLayer();

    const alternativeFuelLayerURL =
      "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Alternate_Fuel/FeatureServer/0";

    const layer = new FeatureLayer({
      url: alternativeFuelLayerURL,
      outFields: ["*"],
      popupTemplate: createPopupTemplate(),
      minScale: 0,
      maxScale: 0,
      renderer: customRenderer,
    });

    // todo filter the "active" corridor, add filtering for each kind of "pending / ready" with info
    const corridorLayer = new FeatureLayer({
      url: "https://services1.arcgis.com/4yjifSiIG17X0gW4/arcgis/rest/services/Alternative_Fuel_Corridors/FeatureServer/2",
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

    const locateBtn = new Locate({ view: view });
    const homeWidget = new Home({ view: view });

    view.ui.add(homeWidget, "top-left");
    view.ui.add(locateBtn, { position: "top-left" });

    function createPopupTemplate() {
      return {
        title: "{NAME}",
        content: "Station type: {Fuel_Type}",
      };
    }

    // Setup the route parameters
    const routeParams = new RouteParameters({
      // An authorization string used to access the routing service
      apiKey: "YOUR_API_KEY",
      stops: new FeatureSet(),
      outSpatialReference: {
        // autocasts as new SpatialReference()
        wkid: 3857,
      },
    });

    // Define the symbology used to display the stops
    const stopSymbol = {
      type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
      style: "cross",
      size: 15,
      outline: {
        // autocasts as new SimpleLineSymbol()
        width: 4,
      },
    };

    // Define the symbology used to display the route
    const routeSymbol = {
      type: "simple-line", // autocasts as SimpleLineSymbol()
      color: [0, 0, 255, 0.5],
      width: 5,
    };

    // Adds a graphic when the user clicks the map. If 2 or more points exist, route is solved.
    view.on("click", addStop);

    function addStop(event) {
      // Add a point at the location of the map click
      const stop = new Graphic({
        geometry: event.mapPoint,
        symbol: stopSymbol,
      });
      routeLayer.add(stop);

      // Execute the route if 2 or more stops are input
      routeParams.stops.features.push(stop);
      if (routeParams.stops.features.length >= 2) {
        route.solve(routeUrl, routeParams).then(showRoute);
      }
    }
    // Adds the solved route to the map as a graphic
    function showRoute(data) {
      const routeResult = data.routeResults[0].route;
      routeResult.symbol = routeSymbol;
      routeLayer.add(routeResult);
    }

    /** Assign the color values to expected type values */
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
    console.log(
      layer.fields?.find((field) => field.name === "Date_Last_Update")
    );
    console.log(layer);
    /** Create the list items to represent each fuel type */
    // todo - use the color from array to override calcite ui icon (or in css)
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
        listItem.id = `list-item-type-${item.name.toLowerCase()}`;
        filterListEl.appendChild(listItem);
      });
    }

    function createCorridorListItems() {
      corridors.forEach((item) => {
        const listItem = document.createElement("calcite-list-item");
        listItem.label = item;
        listItem.value = item;
        listItem.id = `list-item-corridor-${item.toLowerCase()}`;
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
          excludedEffect: "opacity(10%) grayscale(100%)",
          includedEffect: "opacity(100%)",
        };
      });
    }

    function handleFilterChipChange(event) {
      let items = [];
      event.target.selectedItems.forEach((item) =>
        items.push({ name: item.label, code: item.value })
      );
      appState.types = items;
      handleLayerFilter();
    }

    function handleModalChange() {
      modalEl.open = !modalEl.open;
    }

    function handleCorridorListChange() {
      appState.corridor = !appState.corridor;
      corridorLayer.visible = appState.corridor;
    }

    function initializeApp() {
      createFilterListItems();
      createCorridorListItems();
      handleLayerFilter();
    }

    initializeApp();
  })());
