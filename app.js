/** Declare element variables */
const toggleModalEl = document.getElementById("toggle-modal");
const modalEl = document.getElementById("modal");
const corridorListEl = document.getElementById("corridor-list");
const filterListEl = document.getElementById("filter-list");
const routeListEl = document.getElementById("route-list");
const customRouteButton = document.getElementById("custom-route-button");

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
  creatingCustomRouteCurrently: false,
};

// todo use an appropriate key here
const apiKey = "";

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
  "esri/layers/RouteLayer",
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
  esriRequest,
  RouteLayer
) =>
  (async () => {
    toggleModalEl.addEventListener("click", () => handleModalChange());
    corridorListEl.addEventListener("calciteListChange", () => {
      handleCorridorListChange();
    });
    filterListEl.addEventListener("calciteListChange", (event) =>
      handleStationTypeListChange(event)
    );
    routeListEl.addEventListener("calciteListChange", (event) =>
      handleRouteDisplay(event)
    );

    const customRenderer = {
      field: "Fuel_Type",
      type: "unique-value",
      uniqueValueInfos: assignColorsToTypes(),
    };

    const routeUrl =
      "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
    const alternativeFuelLayerURL =
      "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Alternate_Fuel/FeatureServer/0";
    const alternativeFuelCorridorURL =
      "https://services1.arcgis.com/4yjifSiIG17X0gW4/arcgis/rest/services/Alternative_Fuel_Corridors/FeatureServer/2";
    const routeLayer = new GraphicsLayer();

    // todo create custom popup or flow item on click
    const layer = new FeatureLayer({
      url: alternativeFuelLayerURL,
      outFields: ["*"],
      popupTemplate: createPopupTemplate(),
      minScale: 0,
      maxScale: 0,
      renderer: customRenderer,
    });

    // todo limit outfields?
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

    const locateBtn = new Locate({ view: view });
    const homeWidget = new Home({ view: view });

    view.ui.add(homeWidget, "top-left");
    view.ui.add(locateBtn, { position: "top-left" });

    // todo move to flow item, or improve popover, or hide
    function createPopupTemplate() {
      return {
        title: "{NAME}",
        content: "Station type: {Fuel_Type}",
      };
    }

    // todo improve colors
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

    // todo create route items in new function from resource definition

    // todo filter this when there is an active route to limit features to within x_mile_buffer of current route
    // todo add slider to let user adjust this buffer radius
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

    function handleModalChange() {
      modalEl.open = !modalEl.open;
    }

    function handleCorridorListChange() {
      appState.corridor = !appState.corridor;
      corridorLayer.visible = appState.corridor;
    }
    // create a RouteLayer for "Driving Time"

    if (appState.creatingCustomRouteCurrently) {
      // Setup the route parameters
      const routeParams = new RouteParameters({
        // An authorization string used to access the routing service
        apiKey,
        stops: new FeatureSet(),
        outSpatialReference: {
          wkid: 3857,
        },
      });

      // todo adjust the custom symbols for creating custom route
      // todo while creating custom route, de-select any current "popular route", and add "creating route ui"
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

      // Adds a graphic when the user clicks the map. If 2 or more points exist, route is solved.
      // todo - for demo - maybe limit to two stops?
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

    // todo - these take awhile to create on click of list item, should probably create these as app load and hide / show each layer
    // use geocoding for these instead of defined points? Or at least move the pre-defined geometry to reference file
    function handleRouteDisplay(event) {
      const requestedRoute = event.target.selectedItems[0]?.label;
      let requestedRouteStops;

      switch (requestedRoute) {
        case "New York to Los Angeles":
          requestedRouteStops = [
            { geometry: { type: "point", x: -118.2437, y: 34.0522 } },
            { geometry: { type: "point", x: -74.006, y: 40.7128 } },
          ];
          break;
        case "Boston to Washington D.C.":
          requestedRouteStops = [
            { geometry: { type: "point", x: -71.0589, y: 42.3601 } },
            { geometry: { type: "point", x: -77.0369, y: 38.9072 } },
          ];
          break;
        case "Seattle to Chicago":
          requestedRouteStops = [
            { geometry: { type: "point", x: -122.3321, y: 47.6062 } },
            { geometry: { type: "point", x: -87.6298, y: 41.8781 } },
          ];
          break;
        case "Phoenix to Denver":
          requestedRouteStops = [
            { geometry: { type: "point", x: -112.074, y: 33.4484 } },
            { geometry: { type: "point", x: -104.9903, y: 39.7392 } },
          ];
          break;
        case "San Francisco to St. Louis":
          requestedRouteStops = [
            { geometry: { type: "point", x: -122.4194, y: 37.7749 } },
            { geometry: { type: "point", x: -90.1994, y: 38.627 } },
          ];
          break;
      }
      // todo better styling for line and start / end points
      // todo - ability to "flip" route? Maybe not needed for demo
      const drive = new RouteLayer({
        stops: requestedRouteStops,
        effect: "bloom(1, 0.25px, 0)",
      });

      // todo
      drive
        .solve({
          apiKey,
        })
        .then((results) => {
          drive.update(results);
          map.remove(drive);
          map.add(drive);
          //     else map.remove(drive);
          const extent = results.routeInfo.geometry.extent.clone();
          // todo filter station filters to distance in slider
          view.goTo(extent.expand(1.5));
        });
    }
    // function getSuggestedRoutes();
    // for [list of routes], generate route and get total mileage

    function initializeApp() {
      createFilterListItems();
      createCorridorListItems();
      handleLayerFilter();
      // get suggested routes
    }

    // handle route click
    // on suggested route click, slowly highlight + create buffer, zoom to fit.

    // on create custom route, open second block, set starting point on first click, end point on second click,
    //then add as a custom route to a new block section under popular routes called custom routes, add mileage, make selectable, and select

    initializeApp();
  })());
