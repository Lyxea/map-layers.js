

/**
 * This object is used to manage a map and its layers.
 * @param {string} mapDiv - The ID of the div where the map will be displayed (without the # or.)
 * @param {string} geoServerURL - The GeoServer URL used for the layers
 */
var geoMap = function(mapDiv, geoServerURL,keyBing){
    var self = this;
    this.mapDiv = mapDiv;
    this.geoServerURL = geoServerURL;

    var self = this;
    var map;
    var fond;
    var center = ol.proj.transform([2, 45.07], 'EPSG:4326', 'EPSG:3857'); //default by default if no center is defined by default in the conf file
    var zoomdefault = 13;   //default by default if no center is defined by default in the conf file
    var mapLayers =new Map();
    var idLayer = 0;
    var layerNameByJqueryId = new Map();
    var getCapabilities ="";
    var idBaseMap;
    var baseMap = {};
    var defaultBaseMap = "OSM"; //BaseMap by default if no baseMap is defined in the conf file
    var callbackMoveMap = [];
    var getFeatureInfoEnable = true;


    var container = document.getElementById('popup');
    var content = document.getElementById('popup-content');
    var closer = document.getElementById('popup-closer');

    /**
	* Create an overlay to anchor the popup to the map.
	*/
	var overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
            element: container,
            autoPan: true,
            autoPanAnimation: {
            duration: 250
            }
        })
    );
    /**
	* Add a click handler to hide the popup.
	* @return {boolean} Don't follow the href.
	*/
	/*closer.onclick = function() {
		overlay.setPosition(undefined);
		closer.blur();
		return false;
	};*/

    /**
     * Initialize a standard card
     * @param {Object} defaultConfig - Default Map Config (Object.defaultBaseMap, Object.defaultZoomLevel, Object.defaultXCenter, Object.defaultYCenter)
     */
    this.initMap = function(defaultConfig){
        if(defaultConfig.defaultBaseMap !== undefined || defaultConfig.defaultBaseMap != ""){defaultBaseMap = defaultConfig.defaultBaseMap}
        if(defaultConfig.defaultZoomLevel !== undefined || defaultConfig.defaultZoomLevel != ""){zoomdefault = defaultConfig.defaultZoomLevel}
        if(defaultConfig.defaultXCenter !== undefined || defaultConfig.defaultXCenter != ""){
            if(defaultConfig.defaultYCenter !== undefined || defaultConfig.defaultYCenter != ""){
                center = ol.proj.transform([parseFloat(defaultConfig.defaultXCenter), parseFloat(defaultConfig.defaultYCenter)], 'EPSG:4326', 'EPSG:3857');
            }
        }
        self.initBaseMap();
        var scaleLineControl = new ol.control.ScaleLine();
        center = center;
        map = new ol.Map({
            layers: fond,
            target: mapDiv,
            view: new ol.View({
                center : center,
                zoom: zoomdefault
            }),
            controls: []
 
        });
        map.addControl(scaleLineControl);
        $.each(baseMap, function(name, source){
            if(name == defaultBaseMap){source.setVisible(true); mapLayers.set(0, source)}
            map.addLayer(source)
        });
        onMoveMap();
        /**
	   * Add a click handler to the map to render the popup.
	   */
    };

    var measureTooltip;
    var measureTooltipElement;
    var output;
    var tooltipCoord;
    var measuringTool = undefined;
    var vectorMeasureLayer = undefined;
    function createMeasureTooltip() {
        if (measureTooltipElement) {
            measureTooltipElement.parentNode.removeChild(measureTooltipElement);
        }
        measureTooltipElement = document.createElement('div');
        measureTooltipElement.className = 'tooltip tooltip-measure';
        measureTooltip = new ol.Overlay({
            element: measureTooltipElement,
            offset: [0, -15],
            positioning: 'bottom-center'
        });
        map.addOverlay(measureTooltip);
    }

    this.asMeasureInteractive = function(){
        return measuringTool == undefined ? false : true;
    }

    this.createMeasureLayer = function(geometryType){
        vectorMeasureLayer = new ol.layer.Vector({
            source: new ol.source.Vector()
        });
        vectorMeasureLayer.setZIndex(9998);
        map.addLayer(vectorMeasureLayer);
        measuringTool = new ol.interaction.Draw({
            type: geometryType,
            source: vectorMeasureLayer.getSource()
        });
        createMeasureTooltip()
        var html = geometryType === 'Polygon' ? '<sup>2</sup>' : '';
        measuringTool.on('drawstart', function(event) {
            vectorMeasureLayer.getSource().clear();
        
            event.feature.on('change', function(event) {
                
                var measurement = geometryType === 'Polygon' ? event.target.getGeometry().getArea() : event.target.getGeometry().getLength();
        
                var measurementFormatted = measurement > 100 ? (measurement / 1000).toFixed(2) + 'km' : measurement.toFixed(2) + 'm';
                if(geometryType === 'Polygon'){
                    tooltipCoord = event.target.getGeometry().getInteriorPoint().getCoordinates();
                }else{
                    tooltipCoord = event.target.getGeometry().getLastCoordinate();
                }
                measureTooltipElement.innerHTML = measurementFormatted + html
                measureTooltip.setPosition(tooltipCoord);
        
                //resultElement.html(measurementFormatted + html);
            });
        });
        map.addInteraction(measuringTool);
        //createMeasureTooltip();
    }

    this.deleteMeasureLayer = function(){
        if(vectorMeasureLayer != undefined){
            vectorMeasureLayer.getSource().clear();
            vectorMeasureLayer = undefined;
        }
        if(measuringTool != undefined){
            map.removeInteraction(measuringTool);
            measuringTool = undefined;
        }
        measureTooltipElement = null
        map.removeOverlay(measureTooltip);
        measureTooltip = null
    }

    this.bindView = function(map2){
        if(map2 && map2.getMapObj()){
            map2.getMapObj().setView(map.getView());
        }
	}
	
	this.getMapObj = function(){
		return map;
    }
    
    this.enableGetFeatureInfo = function(enable){
        var enable = (typeof enable !== 'undefined') ? enable : true;
        getFeatureInfoEnable = enable;
        closer.onclick();
    }

    /**
     * Display the getfeatureinfo in a popup
     * @param {clickEvent} evt - user event
     */
    this.clickPopup = function(evt){
        content.innerHTML = "";
        if(getFeatureInfoEnable == false){
            return;
        }
        var coordinate = evt.coordinate;
        overlay.setPosition(evt.coordinate);
        
        //for(layer of mapLayers){
        for(var i = 0; i < mapLayers.length; i++){
            var layer = mapLayers[i];
            if(layer[0] != 0){
                var url = layer[1]
                        .getSource()
                        .getGetFeatureInfoUrl(
                            evt.coordinate,
                            map.getView().getResolution(),
                            map.getView().getProjection(),
                            {
                            'INFO_FORMAT': 'text/html'
                            });
                $.ajax({
                  url: url
                }).done(function(data) {
                    overlay.setPosition(evt.coordinate);
                    content.innerHTML = content.innerHTML + data;
                });
            }
            else{
                closer.onclick()
            }
        }
    }

    /**
     * Display the getfeatureinfo in a popup for only the layers passed in parameter
     * @param {clickEvent} evt - user event
     * @param {array} layers    List of IDlayers to interoperate
     */
    this.clickPopupAvailableLayers = function(evt, layers){
        content.innerHTML = "";
        if(getFeatureInfoEnable == false){
            return;
        }
        var coordinate = evt.coordinate;
        overlay.setPosition(evt.coordinate);
        //for(layer of mapLayers){
        for(var i = 0; i < mapLayers.length; i++){
            var layer = mapLayers[i];
            if(layer[0] != 0 && ($.inArray(layer[0],layers)>=0) ){
                var url = layer[1]
                        .getSource()
                        .getGetFeatureInfoUrl(
                            evt.coordinate,
                            map.getView().getResolution(),
                            map.getView().getProjection(),
                            {
                            'INFO_FORMAT': 'text/html'
                            });
                $.ajax({
                  url: url
                }).done(function(data) {
                    overlay.setPosition(evt.coordinate);
                    content.innerHTML = content.innerHTML + data;
                });
            }
            else{
                closer.onclick()
            }
        }
    }

    /**
     * Initialize the object with an existing OpenLayer object
     * @param {Object} mapObject - Object 'map' of openLayers
     */
    this.initWithMapObjet = function(mapObject){
        map = mapObject;
        self.initBaseMap();
        $.each(baseMap, function(name, source){
            if(name == defaultBaseMap){source.setVisible(true); mapLayers.set(0, source)}
            map.addLayer(source)
        });
        map.addOverlay(overlay);
        onMoveMap();
    }

    /**
     * Adds a function to call when the map is moved
     * The function must receive the parameters: zoom, extent and EPSG
     * The function is called on the onMoveEnd
     * @param {callback} callback - function to call when the map moves
     */
    this.addCallbackOnMoveMap = function(callback){
        callbackMoveMap.push(callback);
    }

    /**
     * Function to call all callbacks when the card moves
     */
    var onMoveMap = function(){
        map.on("moveend", function(e){
            //CalculateExtent return un ol.extent
            //http://openlayers.org/en/master/apidoc/ol.View.html#calculateExtent
            //http://openlayers.org/en/master/apidoc/ol.html#.Extent
            actualExtent = map.getView().calculateExtent(map.getSize());
            epsg = map.getView().getProjection().getCode()
            zoom = map.getView().getZoom();
            $.each(callbackMoveMap, function(index, callback){
               
                callback(zoom, actualExtent, epsg);
            })
        });
    }

    this.saveCurrentMap = function(){
        alert("not implemented yet");
        /*map.once('postcompose', function(event) {
            var canvas = event.context.canvas;
            if (navigator.msSaveBlob) {
              navigator.msSaveBlob(canvas.msToBlob(), 'map.png');
            } else {
              canvas.toBlob(function(blob) {
                saveAs(blob, 'map.png');
              });
            }
          });
          map.renderSync();*/
          /*canvas = document.getElementsByTagName("canvas")[0];
        canvas.toBlob(function (blob) {
            saveAs(blob, 'map.png');
        })*/
    }


    /**
     * Add a layer to the map
     * @param {String} layername - The layer name (workspace:layername)
     */
    this.addLayer = function(layername, server){
		var currentServer = this.geoServerURL
		if(server != undefined){
			console.log("Change server by : " + server)
			currentServer = server
		}
			
        newLayerSource =new ol.source.ImageWMS({
            url: currentServer + 'geoserver/ows?',
            serverType: 'geoserver'
        });
        newLayer = new ol.layer.Image({
            source: newLayerSource
        });
        newLayer.getSource().updateParams({'LAYERS': layername});
        var res = map.addLayer(newLayer);
        idLayer = idLayer + 1;
        mapLayers.set(idLayer, newLayer);
        return idLayer;
    };

    /**
     * Perform a function when the layer is loading
     * The callback takes in parameter the ID of the layer
     * @param {function} callback - called callback when the layer is loading
     */
    this.onLayerLoading = function(idLayer, callback){
        mapLayers.get(idLayer).getSource().on('imageloadstart',function(event){
            callback()
        })
    }

    this.onLayerIsLoading = function(idLayer, callback){
        mapLayers.get(idLayer).getSource().on('imageloadend',function(event){
            callback()
        })
    }

    /**
     * Delete a layer
     * @param {int} idLayer  - The ID of the layer (returned by addLayer ())
     */
    this.removeLayer = function(idLayer){
        idLayer = parseInt(idLayer);
        map.removeLayer(mapLayers.get(idLayer));
        mapLayers.delete(idLayer);

    }

    /**
     * Execute a function (callback) on the result of the getCapabilities in json format
     * @param {function} callback - function executed on the result of the getCapabilities
     * @param {bool} forceUpdate - Indicates whether the getCap request should be updated (false by default)
     */
    this.getCap = function(callback, forceUpdate){
        var forceUpdate = (typeof forceUpdate !== 'undefined') ? forceUpdate : false;
        if(getCapabilities == "" || forceUpdate == true ){
            var url = this.geoServerURL + 'geoserver/wms?request=GetCapabilities&service=WMS&version=1.3.0';
            var parser = new ol.format.WMSCapabilities();
            $.ajax(url).then(function(response) {
                getCapabilities = parser.read(response);
                callback(getCapabilities);
            });
        }else{
            callback(getCapabilities);
        }
    };

    /**
     * Retrieves the center (X, Y) of the BBOX of a layer
     * @param {array} Extent - Extend of a layer
     */
    this.getCenterOfExtent = function(Extent){
        var X = Extent[0] + (Extent[2]-Extent[0])/2;
        var Y = Extent[1] + (Extent[3]-Extent[1])/2;
        return [X, Y];
    }

    /**
     * Zoom in on a BBOX by adjusting the zoom
     * @param {Extent} extent - The extent of layer
     * @param {String} epsgExtent - EPSG code like EPSG:4326
     */
     this.setMapCenter = function (extent, epsgExtent){
        var epsgExtent = (typeof epsgExtent !== 'undefined') ? epsgExtent : "EPSG:4326";
         map.getView().setCenter(ol.proj.transform(self.getCenterOfExtent(extent), epsgExtent, 'EPSG:3857'));//We change the center
        var extent = ol.extent.applyTransform(extent, ol.proj.getTransform(epsgExtent, "EPSG:3857"));
         map.getView().fit(extent, map.getSize()); //We adapt the zoom
    }

    /**
     * Sets the zoom level of the map
     * @param {Int} zoom - zoom to set for the map
     */
    this.setZoom = function(zoom){
        map.getView().setZoom(zoom);
    }

    /**
     * Lets you zoom on the layer by adjusting the zoom to the extent of the layer
     * @param {string} idLayer - The ID of the layer (returned by addLayer ())
     */
    this.zoomToLayer = function (idLayer){

        layerName =  mapLayers.get(idLayer).getSource().getParams('LAYERS').LAYERS
        this.getCap(function(myGetCap){
            allLayer = myGetCap.Capability.Layer.Layer;
            var extent;
            for (var i=0, len = allLayer.length; i<len; i++) {
                var layerobj = allLayer[i];
                if (layerobj.Name == layerName) {
                    extent = layerobj.BoundingBox[0].extent; //We recover the BBOX of the layer
                    self.setMapCenter(extent);
                    break;
                }
            }
        });
    }

    /**
     * Lets you zoom in on a list of layers by adjusting the zoom to the extent of the layer
     * @param {Array} idsLayers - Layer ID list (returned by addLayer ())
     */
    this.zoomToLayers = function(idsLayers){
        var allExtent = [];
        //We recover the extent of all layers
        
            self.getCap(function(myGetCap){
                allLayer = myGetCap.Capability.Layer.Layer;
                var extent;
                $.each(idsLayers, function(index, item){
                    layerName =  mapLayers.get(item).getSource().getParams('LAYERS').LAYERS
                    for (var i=0, len = allLayer.length; i<len; i++) {
                        var layerobj = allLayer[i];
                        if (layerobj.Name == layerName) {
                            extent = layerobj.BoundingBox[0].extent; //We recover the BBOX of the layer
                            allExtent.push(extent)
                        }
                    }
                });
                if(allExtent.length <= 0){
                    console.log("Aucune extent trouvée")
                    return;
                }
                var newExtent = allExtent[0]; //We take the 1st as reference
                $.each(allExtent, function (index, item) { // And we recover the max extent of all
                    if(item[0] < newExtent[0]){
                        newExtent[0] = item[0];
                    }
                    if(item[1] < newExtent[1]){
                        newExtent[1] = item[1];
                    }
                    if(item[2] > newExtent[2]){
                        newExtent[2] = item[2];
                    }
                    if(item[3] > newExtent[3]){
                        newExtent[3] = item[3];
                    }
                });
                self.setMapCenter(newExtent);
        });
        //And now we keep the highest value of exten
        
        
    }

    /**
     * Modify the opacity of a layer
     * @param {string} idLayer - The ID of the layer (returned by addLayer ())
     * @param {float} opacity - The opacity to apply on the layer
     */
    this.changeOpacity = function(idLayer, opacity){
        mapLayers.get(idLayer).setOpacity(opacity);
    }

    /**
     * Change the display order of a layer
     * @param {string} idLayer - The ID of the layer (returned by addLayer ())
     * @param {int} index - Change the display order of a layer
     */
    this.changeLayerIndex = function(idLayer, index){
        idLayer = parseInt(idLayer);
        mapLayers.get(idLayer).setZIndex(index);
    }


    /**
     *Lets you change the visibility of a layer list
     * @param {Array of IdlayerName} arrayOfLayer - Array of ID layer (can also be just an ID layer)
     * @param {bool} visibility - true to make visible, false otherwise
     */
    this.setLayerVisibility = function(arrayOfIDLayer, visibility){
        if($.isArray(arrayOfIDLayer)){
            arrayOfIDLayer = arrayOfIDLayer.map(parseInt);
            $.each(arrayOfIDLayer, function(index, value){
                mapLayers.get(value).setVisible(visibility);
            });
        } else {//If we passed just the name of the layer and not an array, we rapel the function in array mode
            self.setLayerVisibility([parseInt(arrayOfIDLayer)], visibility);
        }
    };

    /**
     * Lets you update the value of a parameter for a layer
     * @param {string} idLayer - The ID of the layer (returned by addLayer ())
     * @param {string} paramName - The name of the parameter
     * @param {string} value - The value of the parameter
     */
    this.updateParam = function(idLayer, paramName, value){
        var params = {};//If I do not create my before, the updateParams does not want it.
        params[paramName] = value;
        mapLayers.get(idLayer).getSource().updateParams(params);
    }

    /**
     * Returns the source of a layer
     * @param {string} idLayer - The ID of the layer (returned by addLayer ())
     */
    this.getSource = function(idLayer){
        return mapLayers.get(idLayer).getSource();
    }

    /**
     * Update the size of the div of the map
     */
    this.updateDivMapSize = function(){
        //Adapts the size of the map
        var Hmap = $(window).height();
        $("#"+self.mapDiv).height(Hmap);
    }

    /**
     * Create a list of all available baseMap
     */
    this.initBaseMap = function(){
        baseMap = {};
        baseMap['OSM'] = new ol.layer.Tile({
            title: 'OSM',
            preload: Infinity,
            source: new ol.source.OSM({crossOrigin: null}),
            visible: false
        });
        baseMap['Bing Aerial'] = new ol.layer.Tile({
            title: 'Bing Aerial',
            preload: Infinity,
            visible: false,
            source: new ol.source.BingMaps({
                key: keyBing,
                imagerySet: 'Aerial',
            })
        });
        baseMap['Bing Road'] = new ol.layer.Tile({
            title: 'Bing Road',
            preload: Infinity,
            visible: false,
            source: new ol.source.BingMaps({
                key: keyBing,
                imagerySet: 'Road',
            })
        });
        baseMap['Stamen Toner'] = new ol.layer.Tile({
            title: 'Stamen Toner',
            preload: Infinity,
            source: new ol.source.Stamen({
                layer: 'toner',
            }),
            visible: false
        });
        baseMap['Stamen Watercolor'] = new ol.layer.Tile({
            title: 'Stamen Watercolor',
            preload: Infinity,
            source: new ol.source.Stamen({
                layer: 'watercolor',
            }),
            visible: false
        });
        baseMap['Stamen Terrain'] = new ol.layer.Tile({
            title: 'Stamen Terrain',
            preload: Infinity,
            source: new ol.source.Stamen({
                layer: 'terrain',
            }),
            visible: false
        });
        baseMap['Mapbox Geography'] = new ol.layer.Tile({
            title: 'Mapbox Geography',
            preload: Infinity,
            source: new ol.source.TileJSON({
                url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
            }),
            visible: false
        });
        baseMap['Mapbox Natural earth'] = new ol.layer.Tile({
            title: 'Mapbox Natural earth',
            preload: Infinity,
            source: new ol.source.TileJSON({
                url: 'https://api.tiles.mapbox.com/v3/mapbox.natural-earth-hypso-bathy.json?secure',
            }),
            visible: false
        });

    }

    /**
     * Returns the list of baseMap
     */
    this.getBaseMaps = function(){
        return baseMap;
    }

    /**
     * Change the baseMap to display
     * @param {string} baseMapName - name / key of the baseMap
     */
    this.changeBaseMap = function(baseMapName){
        $.each(self.getBaseMaps(), function(name, source){
            source.setVisible(false); // on les passes tous à false
            if(name == baseMapName){    //Et si on tombe sur la demandé, on la force à true
                source.setVisible(true);
                mapLayers.set(0, source)
            }
        })

    }


/**
 * END OF geoMap Object
 */
}