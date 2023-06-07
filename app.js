/** Declare element variables */
const toggleModalEl = document.getElementById("toggle-modal");
const modalEl = document.getElementById("modal");
const filterListEl = document.getElementById("filter-list");

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
  mode: "light",
};

/** Maps SDK */
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Home",
  "esri/widgets/Locate",
], (Map, MapView, FeatureLayer, Home, Locate) =>
  (async () => {
    toggleModalEl.addEventListener("click", () => handleModalChange());
    filterListEl.addEventListener("calciteListChange", (event) =>
      handleListChange(event)
    );

    const customRenderer = {
      field: "Fuel_Type",
      type: "unique-value",
      uniqueValueInfos: assignColorsToTypes(),
    };

    const layer = new FeatureLayer({
      url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Alternate_Fuel/FeatureServer/0",
      outFields: ["*"],
      popupTemplate: createPopupTemplate(),
      minScale: 0,
      maxScale: 0,
      renderer: customRenderer,
    });

    const map = new Map({
      basemap: "streets-night-vector",
      layers: [layer],
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

    /** Assign the color values to expected type values */
    function assignColorsToTypes() {
      let uniqueValueInfos = [];
      allTypes.forEach((type, index) => {
        uniqueValueInfos.push({
          value: type.code,
          symbol: {
            type: "simple-marker",
            size: 3,
            color: typeColors[index],
            outline: { color: typeColors[index], width: 0.5 },
          },
        });
      });
      return uniqueValueInfos;
    }

    /** Create the list items to represent each fuel type */
    // todo - use the color from array to override calcite ui icon (or in css)
    function createListItems() {
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

    function handleListChange(event) {
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

    function initializeApp() {
      createListItems();
      handleLayerFilter();
    }

    initializeApp();
  })());
