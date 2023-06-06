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
const typeColors = ["#c66a4a", "#7a81ff", "#3cccb4", "#0096ff", "#f260a1"];

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
      type: "simple", //
      field: "Fuel_Type",
      symbol: {
        type: "simple-marker",
        size: 6,
        color: "black",
        outline: {
          width: 0.5,
          color: "gray",
        },
      },
      // not working with coded value format
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
        console.log("me");
        uniqueValueInfos.push({
          value: type.name,
          symbol: {
            color: typeColors[index],
            outline: { color: typeColors[index] },
          },
        });
      });
      console.log(uniqueValueInfos);
      return uniqueValueInfos;
    }

    /** Create the chips to represent each jurisdiction */
    function createFilterChips() {
      allTypes.forEach((item) => {
        const listItem = document.createElement("calcite-list-item");
        listItem.label = item.name;
        listItem.value = item.code;
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
      createFilterChips();
      handleLayerFilter();
    }

    initializeApp();
  })());
