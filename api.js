
    require([
      "esri/WebScene",
      "esri/views/SceneView",
      "esri/layers/BuildingSceneLayer",
      "esri/widgets/Slice",
      "esri/widgets/Slice/SlicePlane",
      "esri/widgets/LayerList",
      "esri/core/Collection",
      "esri/widgets/DirectLineMeasurement3D",
      "esri/widgets/AreaMeasurement3D"
    ], function (
      WebScene,
      SceneView,
      BuildingSceneLayer,
      Slice,
      SlicePlane,
      LayerList,
      Collection,
      DirectLineMeasurement3D,
      AreaMeasurement3D
    ) {
      
      var activeWidget = null;
      // Load webscene and display it in a SceneView
      const webscene = new WebScene({
        portalItem: {
          id: "5e1da34cec3e48059e005cd870493556"
        }
      });

      const view = new SceneView({
        container: "viewDiv",
        map: webscene
      });

      // Create the BuildingSceneLayer and add it to the webscene
      const buildingLayer = new BuildingSceneLayer({
        url:
          "https://tiles.arcgis.com/tiles/V6ZHFr6zdgNZuVG0/arcgis/rest/services/BSL__4326__US_Redlands__EsriAdminBldg_PublicDemo/SceneServer",
        title: "Propuesta Estructural Bogotá"
      });
      webscene.layers.add(buildingLayer);

      const excludedLayers = [];
      const sliceButton = document.getElementById("slice");
      const resetPlaneBtn = document.getElementById("resetPlaneBtn");
      const clearPlaneBtn = document.getElementById("clearPlaneBtn");
      const sliceOptions = document.getElementById("sliceOptions");
      const plane = new SlicePlane({
        position: {
          latitude: 34.0600460070941,
          longitude: -117.18669237418565,
          z: 417.75
        },
        tilt: 32.62,
        width: 29,
        height: 29,
        heading: 0.46
      });
      let sliceWidget = null;
      let doorsLayer = null;
      let sliceTiltEnabled = true;

      view.ui.add("menu", "top-right");

      buildingLayer.when(function () {
        // Iterate through the flat array of sublayers and extract the ones
        // that should be excluded from the slice widget
        buildingLayer.allSublayers.forEach(function (layer) {
          // modelName is standard accross all BuildingSceneLayer,
          // use it to identify a certain layer
          switch (layer.modelName) {
            // Because of performance reasons, the Full Model view is
            // by default set to false. In this scene the Full Model should be visible.
            case "FullModel":
              layer.visible = true;
              break;
            case "Overview":
            case "Rooms":
              layer.visible = false;
              break;
            // Extract the layers that should not be hidden by the slice widget
            case "Doors":
              doorsLayer = layer;
              excludedLayers.push(layer);
              break;
            default:
              layer.visible = true;
          }
        });

        setSliceWidget();
      });

      function setSliceWidget() {
        sliceWidget = new Slice({
          view: view,
          container: "sliceContainer"
        });
        sliceWidget.viewModel.excludedLayers.addMany(excludedLayers);
        sliceTiltEnabled = true;
        sliceWidget.viewModel.tiltEnabled = sliceTiltEnabled;
        sliceWidget.viewModel.shape = plane;
        sliceWidget.viewModel.watch("state", function (value) {
          if (value === "ready") {
            clearPlaneBtn.style.display = "none";
          } else {
            clearPlaneBtn.style.display = "inherit";
          }
        });
      }

      resetPlaneBtn.addEventListener("click", function () {
        document.getElementById("tiltEnabled").checked = true;
        sliceTiltEnabled = true;
        sliceWidget.viewModel.tiltEnabled = sliceTiltEnabled;
        sliceWidget.viewModel.shape = plane;
      });

      clearPlaneBtn.addEventListener("click", function () {
        sliceWidget.viewModel.clear();
      });

      document
        .getElementById("tiltEnabled")
        .addEventListener("change", function (event) {
          sliceTiltEnabled = event.target.checked;
          sliceWidget.viewModel.tiltEnabled = sliceTiltEnabled;
        });

      document
        .getElementById("color")
        .addEventListener("change", function (event) {
          if (event.target.checked) {
            // A renderer can be set on a BuildingComponentSublayer
            doorsLayer.renderer = {
              type: "simple", // autocasts as new UniqueValueRenderer()
              symbol: {
                type: "mesh-3d", // autocasts as new MeshSymbol3D()
                symbolLayers: [
                  {
                    type: "fill", // autocasts as new FillSymbol3DLayer()
                    material: {
                      color: "red"
                    }
                  }
                ]
              }
            };
          } else {
            doorsLayer.renderer = null;
          }
        });

      // Add a layer list widget
      const layerList = new LayerList({
        view: view
      });
      view.ui.empty("top-left");
      view.ui.add(layerList, "top-left");
       view.ui.add("topbar", "top-right");

      document
        .getElementById("distanceButton")
        .addEventListener("click", function () {
          setActiveWidget(null);
          if (!this.classList.contains("active")) {
            setActiveWidget("distance");
          } else {
            setActiveButton(null);
          }
        });

      document
        .getElementById("areaButton")
        .addEventListener("click", function () {
          setActiveWidget(null);
          if (!this.classList.contains("active")) {
            setActiveWidget("area");
          } else {
            setActiveButton(null);
          }
        });

      function setActiveWidget(type) {
        switch (type) {
          case "distance":
            activeWidget = new DirectLineMeasurement3D({
              view: view
            });

            // skip the initial 'new measurement' button
            activeWidget.viewModel.newMeasurement();

            view.ui.add(activeWidget, "top-right");
            setActiveButton(document.getElementById("distanceButton"));
            break;
          case "area":
            activeWidget = new AreaMeasurement3D({
              view: view
            });

            // skip the initial 'new measurement' button
            activeWidget.viewModel.newMeasurement();

            view.ui.add(activeWidget, "top-right");
            setActiveButton(document.getElementById("areaButton"));
            break;
          case null:
            if (activeWidget) {
              view.ui.remove(activeWidget);
              activeWidget.destroy();
              activeWidget = null;
            }
            break;
        }
      }

      function setActiveButton(selectedButton) {
        // focus the view to activate keyboard shortcuts for sketching
        view.focus();
        var elements = document.getElementsByClassName("active");
        for (var i = 0; i < elements.length; i++) {
          elements[i].classList.remove("active");
        }
        if (selectedButton) {
          selectedButton.classList.add("active");
        }
      }
    });
