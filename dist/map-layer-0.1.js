/*!
 * map-layer.js
 * https://github.com/Lyxea/map-layers.js
 * Version: 0.1
 *
 * Copyright 2018 Map-layers.js Contributors
 * Released under the Apache License 2.0
 * https://github.com/Lyxea/map-layers.js/blob/master/LICENSE
 */
//Pour les slider, permet de les centrer à gauche et à droite
jQuery.fn.centerHorizontal = function () {
    this.css('position', 'absolute');
    var widthmapcurrent = $('.map').width()    /*-$(".control-sidebar").outerWidth()*/;
    /*this.css("width", 80*(widthmapcurrent)/100);*/
    /*this.css("left", 10*(widthmapcurrent)/100);*/
    return this;
};
jQuery.fn.centerVertical = function () {
    this.css('position', 'absolute');
    this.css('top', Math.max(0, ($('.map').height() - $(this).outerHeight()) / 2 + $('.map').scrollTop()) + 'px');
    return this;
};
var dimensionSlider = function (elevDiv, timeDiv) {
    var self = this;
    var ISO8601 = new Date('1990-11-25T12:00:00.000Z');
    var ISO8601_diviseur = 3600000;
    var elevIdLayers = [];
    var timeIdLayers = [];
    var slTimeValues = {};
    var slTimeFloatValues = {};
    var slElevValues = {};
    var elevDiv = elevDiv;
    var timeDiv = timeDiv;
    var callBackGeoMapUpdateParam;
    var callbackLMChangeVisibility;
    this.resetDimensionSlider = function () {
        elevIdLayers = [];
        timeIdLayers = [];
        slTimeValues = {};
        slTimeFloatValues = {};
        slElevValues = {};
    };
    /**
     * Permet de mettre à jour un paramètre d'un layer
     * Le callback prend en paramètre l'id du layer, le nom du param et sa value
     * @param {callback} callkack - Fcuntion qui permet de mettre à jour un parmètre d'un layer
     */
    this.setCallbackUpdateParam = function (callkack) {
        callBackGeoMapUpdateParam = callkack;
    };
    /**
     * Permet de mettre à jour l'eye de visibilité du LayerManager pour un layer donnée.
     * Lorsque les config des sliders ne permettent pas un affichage d'un layer, celui aura l'eye de visbilité inactif.
     * Cette fonction prend en paramètre l'id du layer et un boolean de visibilité
     * @param {callback} callkack - Function qui permet de changer l'eye de visibilité d'un layer
     */
    this.setCallbackChangeVisiblity = function (callkack) {
        callbackLMChangeVisibility = callkack;
    };
    /**
     * Transforme une date au format ISO 8601 en float (nombre de jour depuis 1990-11-25T12:00:00.000Z)
     * @param {string} dateString - Date ISO8601 à transformer
     */
    var ISO8601ToFloat = function (dateString) {
        date = new Date(dateString);
        val = (date - ISO8601) / ISO8601_diviseur;
        return val;
    };
    /**
     * Transforme un float au format date ISO 8601
     * @param {float} floatValue - Nombre de jour depuis 1990-11-25T12:00:00.000Z
     */
    var floatToISO8601 = function (floatValue) {
        var copiedISO8601 = new Date(ISO8601.getTime());
        copiedISO8601.setHours(copiedISO8601.getHours() + parseInt(floatValue));
        return copiedISO8601;
    };
    /**
     * Cette fonction applique le callback donnée sur chaque valeur de chacune des dimension.
     * Le callback est appelé avec le tableau slTimeValues pour la dimension time et slElevValues pour la dimensions elevation
     * @param {int} idLayer - L'ID du layer (retourné par geoMap())
     * @param {xml} layerCapabilities - Capabilities du layer
     * @param {Function} callback - Fonction qui sera appelé pour chaque valeur présentes pour cahque dimension
     */
    var sliderAddOrRemoveLayer = function (idLayer, layerCapabilities, callback) {
        if (layerCapabilities === undefined) {
            return;
        }
        $.each(layerCapabilities.Dimension, function (index, dimObject) {
            currentVal = dimObject.values.split(',');
            $.each(currentVal, function (index, value) {
                if (dimObject.name == 'time') {
                    //if($.inArray(idLayer, timeIdLayers)<0){timeIdLayers.push(idLayer)}
                    callback(slTimeValues, value, timeIdLayers);
                } else {
                    if (dimObject.name == 'elevation') {
                        //if($.inArray(idLayer, elevIdLayers)<0){elevIdLayers.push(idLayer)}
                        callback(slElevValues, parseInt(value), elevIdLayers);
                    }
                }
            });
        });
    };
    /**
     * Permet d'ajouter un layer au slider
     * @param {int} idLayer - L'ID du layer (retourné par geoMap())
     * @param {xml} layerCapabilities - Capabilities du layer
     */
    this.sliderAddLayer = function (idLayer, layerCapabilities) {
        if (layerCapabilities === undefined || layerCapabilities.Dimension === undefined) {
            // le Layer n'a pas de dimension
            return;
        }
        sliderAddOrRemoveLayer(idLayer, layerCapabilities, function (array, value, idArray) {
            if ($.inArray(idLayer, idArray) < 0) {
                idArray.push(idLayer);
            }
            if (!array[value]) {
                array[value] = [];
            }
            // Init l'array s'il n'existe pas encore
            if ($.inArray(idLayer, array[value]) < 0) {
                //si IdLayer n'est pas dans array
                array[value].push(idLayer);
            }
        });
    };
    /**
     * Permet de supprimer un layer au slider
     * @param {int} idLayer - L'ID du layer (retourné par geoMap())
     * @param {xml} layerCapabilities - Capabilities du layer
     */
    this.sliderRemoveLayer = function (idLayer, layerCapabilities) {
        timeIdLayers = jQuery.grep(timeIdLayers, function (value) {
            return value != idLayer;
        });
        elevIdLayers = jQuery.grep(elevIdLayers, function (value) {
            return value != idLayer;
        });
        sliderAddOrRemoveLayer(idLayer, layerCapabilities, function (array, value, idArray) {
            if (array[value]) {
                array[value] = jQuery.grep(array[value], function (valueIter) {
                    return valueIter != idLayer;
                });
                if (array[value].length <= 0) {
                    delete array[value];
                }
            }
        });
    };
    /**
     * Permet de mettre à jour le slider des elevations avec les informations du layer donné en param
     * @param {int} idLayer - L'ID du layer (retourné par geoMap())
     */
    this.updateElevSlider = function (idLayer) {
        var elevValues = Object.keys(slElevValues);
        var oldValue = $('#slider_layer_input').val();
        $('#' + elevDiv).html('');
        $('#' + elevDiv).hide();
        if (elevValues.length <= 1) {
            return;
        }
        if (oldValue == '' || oldValue === undefined || oldValue === null) {
            oldValue = Math.min.apply(null, elevValues);
        }
        var timeVal = -1;
        if ($('#' + timeDiv).find('#slider_time_input') !== undefined) {
            var timeVal = $('#' + timeDiv).find('#slider_time_input').val();
        }
        $('#' + elevDiv).show();
        $('#' + elevDiv).append('<span class=\'textColor1\'>' + trans['level'] + '</span><i class=\'fa fa-caret-up fa-2x sl-up color1Hover\' id=\'up_elev\' aria-hidden=\'true\'></i><input id=\'slider_layer_input\' class=\'dim2-slider\'><i class=\'fa fa-caret-down fa-2x color1Hover sl-down\' id=\'down_elev\' aria-hidden=\'true\'></i>');
        var slider_layer = $('#slider_layer_input').slider({
                value: oldValue,
                step: 1,
                min: Math.min.apply(null, elevValues),
                max: Math.max.apply(null, elevValues),
                ticks: elevValues,
                orientation: 'vertical'
            }).on('slideStop', function () {
                $.each(timeIdLayers, function (index, item) {
                    self.updateLayer(item);
                });
            });
        $('#' + elevDiv).centerVertical();
        $('#slider_layer_input').trigger('slideStop');
        /**
         * Lorsque l'utilisateur clique sur les fleches up et down
         */
        $('#' + elevDiv).find('#down_elev').click(function () {
            if ($('#slider_layer_input').val() >= Math.max.apply(null, elevValues)) {
                return;
            }
            var actualIndex = $('#slider_layer_input').val();
            var newVal = elevValues[actualIndex];
            $('#slider_layer_input').slider('setValue', newVal);
            $('#slider_layer_input').trigger('slideStop');
        });
        $('#' + elevDiv).find('#up_elev').click(function () {
            if ($('#slider_layer_input').val() <= Math.min.apply(null, elevValues)) {
                return;
            }
            var actualIndex = $('#slider_layer_input').val();
            var newVal = elevValues[actualIndex - 2];
            $('#slider_layer_input').slider('setValue', newVal);
            $('#slider_layer_input').trigger('slideStop');
        });
    };
    /**
     * Permet de mettre à jour le slider des Time avec les informations du layer donné en param
     * @param {int} idLayer - L'ID du layer (retourné par geoMap())
     */
    this.updateTimeSlider = function (idLayer) {
        var timeValues = Object.keys(slTimeValues);
        var timeTransformValues = [];
        $.each(timeValues, function (index, value) {
            timeTransformValues.push(ISO8601ToFloat(value));
        });
        var timeTransformeKeyValues = {};
        // Permet d'avoir une map où la clé est le chiffre correspondant au time et la value est un array des layer dispo
        $.each(slTimeValues, function (index, value) {
            var newIndex = ISO8601ToFloat(index).toString() + ' ';
            if (!timeTransformeKeyValues[newIndex]) {
                timeTransformeKeyValues[newIndex] = [];
            }
            $.each(value, function (index, val) {
                timeTransformeKeyValues[newIndex].push(val);
            });
        });
        var oldValue = $('#slider_time_input').val();
        $('#' + timeDiv).html('');
        $('#' + timeDiv).hide();
        if (timeTransformValues.length <= 1) {
            return;
        }
        if (oldValue == '' || oldValue === undefined || oldValue === null) {
            oldValue = Math.min.apply(null, timeTransformValues);
        }
        var elevVal = -1;
        if ($('#' + elevDiv).find('#slider_layer_input') !== undefined) {
            var elevVal = $('#' + elevDiv).find('#slider_layer_input').val();
        }
        $('#' + timeDiv).show();
        $('#' + timeDiv).append('<span class=\'textColor1 col-md-2\'>' + trans['time'] + '</span> <span class=\'col-md-10\'><i class=\'fa fa-caret-left fa-2x sl-left color1Hover\' id=\'down_time\' aria-hidden=\'true\'></i><input id=\'slider_time_input\'><i class=\'fa fa-caret-right fa-2x color1Hover sl-right\' id=\'up_time\' aria-hidden=\'true\'></i></span>');
        $('#slider_time_input').slider({
            value: oldValue,
            step: 1,
            min: Math.min.apply(null, timeTransformValues),
            max: Math.max.apply(null, timeTransformValues)
        }).on('slideStop', function () {
            $.each(elevIdLayers, function (index, item) {
                self.updateLayer(item);
            });
        });
        $('#' + timeDiv).centerHorizontal();
        $('#slider_time_input').trigger('slideStop');
        /**
         * Lorsque l'utilisateur clique sur les fleches up et down
         */
        $('#' + timeDiv).find('#down_time').click(function () {
            if ($('#slider_time_input').val() <= Math.min.apply(null, timeTransformValues)) {
                return;
            }
            var newVal = timeTransformValues[$('#slider_time_input').val() - 1];
            $('#slider_time_input').slider('setValue', newVal);
            $('#slider_time_input').trigger('slideStop');
        });
        $('#' + timeDiv).find('#up_time').click(function () {
            if ($('#slider_time_input').val() >= Math.max.apply(null, timeTransformValues)) {
                return;
            }
            var newVal = timeTransformValues[parseInt($('#slider_time_input').val()) + 1];
            $('#slider_time_input').slider('setValue', newVal);
            $('#slider_time_input').trigger('slideStop');
        });
    };
    /**
     * Permet de mettre à jour un layer, param et autre (lorsqu'il vient d'être re-activé par le layermanager par exemple)
     * @param {int} idLayer - L'ID du layer (retourné par geoMap())
     */
    this.updateLayer = function (idLayer) {
        if ($.inArray(idLayer, elevIdLayers) < 0 && $.inArray(idLayer, timeIdLayers) < 0) {
            //Ce layer n'a pas de dimension, on s'en occupe pas
            return;
        }
        var timeVal;
        var elevVal;
        var availableTime = false;
        var availableElev = false;
        if ($('#' + timeDiv).find('#slider_time_input') !== undefined) {
            timeVal = $('#' + timeDiv).find('#slider_time_input').val();
        }
        if ($('#' + elevDiv).find('#slider_layer_input') !== undefined) {
            elevVal = $('#' + elevDiv).find('#slider_layer_input').val();
        }
        $.each(slTimeValues, function (index, item) {
            if (timeVal == ISO8601ToFloat(index)) {
                if ($.inArray(idLayer, item) >= 0) {
                    //Time disponible
                    availableTime = true;
                    callBackGeoMapUpdateParam(idLayer, 'TIME', index);
                }
            }
        });
        if (slElevValues[elevVal]) {
            if ($.inArray(idLayer, slElevValues[elevVal]) >= 0) {
                //Elev disponible
                availableElev = true;
                callBackGeoMapUpdateParam(idLayer, 'ELEVATION', elevVal);
            }
        }
        if (availableElev == false || availableTime == false) {
            //Si un des deux param n'est pas dispo pour cette couche, on la cache
            callbackLMChangeVisibility(idLayer, false);
        }
    }    /**
     * END OF dimensionSlider Object
     */;
};
/**
 * This object is used to manage a map and its layers.
 * @param {string} mapDiv - The ID of the div where the map will be displayed (without the # or.)
 * @param {string} geoServerURL - The GeoServer URL used for the layers
 */
var geoMap = function (mapDiv, geoServerURL, keyBing) {
    var self = this;
    this.mapDiv = mapDiv;
    this.geoServerURL = geoServerURL;
    var self = this;
    var map;
    var fond;
    var center = ol.proj.transform([2, 45.07], 'EPSG:4326', 'EPSG:3857');
    //default by default if no center is defined by default in the conf file
    var zoomdefault = 13;
    //default by default if no center is defined by default in the conf file
    var mapLayers = new Map();
    var idLayer = 0;
    var layerNameByJqueryId = new Map();
    var getCapabilities = '';
    var idBaseMap;
    var baseMap = {};
    var defaultBaseMap = 'OSM';
    //BaseMap by default if no baseMap is defined in the conf file
    var callbackMoveMap = [];
    var getFeatureInfoEnable = true;
    var container = document.getElementById('popup');
    var content = document.getElementById('popup-content');
    var closer = document.getElementById('popup-closer');
    /**
	* Create an overlay to anchor the popup to the map.
	*/
    var overlay = new ol.Overlay({
            element: container,
            autoPan: true,
            autoPanAnimation: { duration: 250 }
        });
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
    this.initMap = function (defaultConfig) {
        if (defaultConfig.defaultBaseMap !== undefined || defaultConfig.defaultBaseMap != '') {
            defaultBaseMap = defaultConfig.defaultBaseMap;
        }
        if (defaultConfig.defaultZoomLevel !== undefined || defaultConfig.defaultZoomLevel != '') {
            zoomdefault = defaultConfig.defaultZoomLevel;
        }
        if (defaultConfig.defaultXCenter !== undefined || defaultConfig.defaultXCenter != '') {
            if (defaultConfig.defaultYCenter !== undefined || defaultConfig.defaultYCenter != '') {
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
                center: center,
                zoom: zoomdefault
            }),
            controls: []
        });
        map.addControl(scaleLineControl);
        $.each(baseMap, function (name, source) {
            if (name == defaultBaseMap) {
                source.setVisible(true);
                mapLayers.set(0, source);
            }
            map.addLayer(source);
        });
        onMoveMap();    /**
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
    this.asMeasureInteractive = function () {
        return measuringTool == undefined ? false : true;
    };
    this.createMeasureLayer = function (geometryType) {
        vectorMeasureLayer = new ol.layer.Vector({ source: new ol.source.Vector() });
        vectorMeasureLayer.setZIndex(9998);
        map.addLayer(vectorMeasureLayer);
        measuringTool = new ol.interaction.Draw({
            type: geometryType,
            source: vectorMeasureLayer.getSource()
        });
        createMeasureTooltip();
        var html = geometryType === 'Polygon' ? '<sup>2</sup>' : '';
        measuringTool.on('drawstart', function (event) {
            vectorMeasureLayer.getSource().clear();
            event.feature.on('change', function (event) {
                var measurement = geometryType === 'Polygon' ? event.target.getGeometry().getArea() : event.target.getGeometry().getLength();
                var measurementFormatted = measurement > 100 ? (measurement / 1000).toFixed(2) + 'km' : measurement.toFixed(2) + 'm';
                if (geometryType === 'Polygon') {
                    tooltipCoord = event.target.getGeometry().getInteriorPoint().getCoordinates();
                } else {
                    tooltipCoord = event.target.getGeometry().getLastCoordinate();
                }
                measureTooltipElement.innerHTML = measurementFormatted + html;
                measureTooltip.setPosition(tooltipCoord);    //resultElement.html(measurementFormatted + html);
            });
        });
        map.addInteraction(measuringTool);    //createMeasureTooltip();
    };
    this.deleteMeasureLayer = function () {
        if (vectorMeasureLayer != undefined) {
            vectorMeasureLayer.getSource().clear();
            vectorMeasureLayer = undefined;
        }
        if (measuringTool != undefined) {
            map.removeInteraction(measuringTool);
            measuringTool = undefined;
        }
        measureTooltipElement = null;
        map.removeOverlay(measureTooltip);
        measureTooltip = null;
    };
    this.bindView = function (map2) {
        if (map2 && map2.getMapObj()) {
            map2.getMapObj().setView(map.getView());
        }
    };
    this.getMapObj = function () {
        return map;
    };
    this.enableGetFeatureInfo = function (enable) {
        var enable = typeof enable !== 'undefined' ? enable : true;
        getFeatureInfoEnable = enable;
        closer.onclick();
    };
    /**
     * Display the getfeatureinfo in a popup
     * @param {clickEvent} evt - user event
     */
    this.clickPopup = function (evt) {
        content.innerHTML = '';
        if (getFeatureInfoEnable == false) {
            return;
        }
        var coordinate = evt.coordinate;
        overlay.setPosition(evt.coordinate);
        //for(layer of mapLayers){
        for (var i = 0; i < mapLayers.length; i++) {
            var layer = mapLayers[i];
            if (layer[0] != 0) {
                var url = layer[1].getSource().getGetFeatureInfoUrl(evt.coordinate, map.getView().getResolution(), map.getView().getProjection(), { 'INFO_FORMAT': 'text/html' });
                $.ajax({ url: url }).done(function (data) {
                    overlay.setPosition(evt.coordinate);
                    content.innerHTML = content.innerHTML + data;
                });
            } else {
                closer.onclick();
            }
        }
    };
    /**
     * Display the getfeatureinfo in a popup for only the layers passed in parameter
     * @param {clickEvent} evt - user event
     * @param {array} layers    List of IDlayers to interoperate
     */
    this.clickPopupAvailableLayers = function (evt, layers) {
        content.innerHTML = '';
        if (getFeatureInfoEnable == false) {
            return;
        }
        var coordinate = evt.coordinate;
        overlay.setPosition(evt.coordinate);
        //for(layer of mapLayers){
        for (var i = 0; i < mapLayers.length; i++) {
            var layer = mapLayers[i];
            if (layer[0] != 0 && $.inArray(layer[0], layers) >= 0) {
                var url = layer[1].getSource().getGetFeatureInfoUrl(evt.coordinate, map.getView().getResolution(), map.getView().getProjection(), { 'INFO_FORMAT': 'text/html' });
                $.ajax({ url: url }).done(function (data) {
                    overlay.setPosition(evt.coordinate);
                    content.innerHTML = content.innerHTML + data;
                });
            } else {
                closer.onclick();
            }
        }
    };
    /**
     * Initialize the object with an existing OpenLayer object
     * @param {Object} mapObject - Object 'map' of openLayers
     */
    this.initWithMapObjet = function (mapObject) {
        map = mapObject;
        self.initBaseMap();
        $.each(baseMap, function (name, source) {
            if (name == defaultBaseMap) {
                source.setVisible(true);
                mapLayers.set(0, source);
            }
            map.addLayer(source);
        });
        map.addOverlay(overlay);
        onMoveMap();
    };
    /**
     * Adds a function to call when the map is moved
     * The function must receive the parameters: zoom, extent and EPSG
     * The function is called on the onMoveEnd
     * @param {callback} callback - function to call when the map moves
     */
    this.addCallbackOnMoveMap = function (callback) {
        console.log(callback);
        callbackMoveMap.push(callback);
    };
    /**
     * Function to call all callbacks when the card moves
     */
    var onMoveMap = function () {
        map.on('moveend', function (e) {
            //CalculateExtent return un ol.extent
            //http://openlayers.org/en/master/apidoc/ol.View.html#calculateExtent
            //http://openlayers.org/en/master/apidoc/ol.html#.Extent
            actualExtent = map.getView().calculateExtent(map.getSize());
            epsg = map.getView().getProjection().getCode();
            zoom = map.getView().getZoom();
            $.each(callbackMoveMap, function (index, callback) {
                callback(zoom, actualExtent, epsg);
            });
        });
    };
    this.saveCurrentMap = function () {
        alert('not implemented yet');    /*map.once('postcompose', function(event) {
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
    };
    /**
     * Add a layer to the map
     * @param {String} layername - The layer name (workspace:layername)
     */
    this.addLayer = function (layername, server) {
        var currentServer = this.geoServerURL;
        if (server != undefined) {
            console.log('Change server by : ' + server);
            currentServer = server;
        }
        newLayerSource = new ol.source.ImageWMS({
            url: currentServer + 'geoserver/ows?',
            serverType: 'geoserver'
        });
        newLayer = new ol.layer.Image({ source: newLayerSource });
        newLayer.getSource().updateParams({ 'LAYERS': layername });
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
    this.onLayerLoading = function (idLayer, callback) {
        mapLayers.get(idLayer).getSource().on('imageloadstart', function (event) {
            callback();
        });
    };
    this.onLayerIsLoading = function (idLayer, callback) {
        mapLayers.get(idLayer).getSource().on('imageloadend', function (event) {
            callback();
        });
    };
    /**
     * Delete a layer
     * @param {int} idLayer  - The ID of the layer (returned by addLayer ())
     */
    this.removeLayer = function (idLayer) {
        idLayer = parseInt(idLayer);
        map.removeLayer(mapLayers.get(idLayer));
        mapLayers.delete(idLayer);
    };
    /**
     * Execute a function (callback) on the result of the getCapabilities in json format
     * @param {function} callback - function executed on the result of the getCapabilities
     * @param {bool} forceUpdate - Indicates whether the getCap request should be updated (false by default)
     */
    this.getCap = function (callback, forceUpdate) {
        var forceUpdate = typeof forceUpdate !== 'undefined' ? forceUpdate : false;
        if (getCapabilities == '' || forceUpdate == true) {
            var url = this.geoServerURL + 'geoserver/wms?request=GetCapabilities&service=WMS&version=1.3.0';
            var parser = new ol.format.WMSCapabilities();
            $.ajax(url).then(function (response) {
                getCapabilities = parser.read(response);
                callback(getCapabilities);
            });
        } else {
            callback(getCapabilities);
        }
    };
    /**
     * Retrieves the center (X, Y) of the BBOX of a layer
     * @param {array} Extent - Extend of a layer
     */
    this.getCenterOfExtent = function (Extent) {
        var X = Extent[0] + (Extent[2] - Extent[0]) / 2;
        var Y = Extent[1] + (Extent[3] - Extent[1]) / 2;
        return [X, Y];
    };
    /**
     * Zoom in on a BBOX by adjusting the zoom
     * @param {Extent} extent - The extent of layer
     * @param {String} epsgExtent - EPSG code like EPSG:4326
     */
    this.setMapCenter = function (extent, epsgExtent) {
        var epsgExtent = typeof epsgExtent !== 'undefined' ? epsgExtent : 'EPSG:4326';
        map.getView().setCenter(ol.proj.transform(self.getCenterOfExtent(extent), epsgExtent, 'EPSG:3857'));
        //We change the center
        var extent = ol.extent.applyTransform(extent, ol.proj.getTransform(epsgExtent, 'EPSG:3857'));
        map.getView().fit(extent, map.getSize());    //We adapt the zoom
    };
    /**
     * Sets the zoom level of the map
     * @param {Int} zoom - zoom to set for the map
     */
    this.setZoom = function (zoom) {
        map.getView().setZoom(zoom);
    };
    /**
     * Lets you zoom on the layer by adjusting the zoom to the extent of the layer
     * @param {string} idLayer - The ID of the layer (returned by addLayer ())
     */
    this.zoomToLayer = function (idLayer) {
        layerName = mapLayers.get(idLayer).getSource().getParams('LAYERS').LAYERS;
        this.getCap(function (myGetCap) {
            allLayer = myGetCap.Capability.Layer.Layer;
            var extent;
            for (var i = 0, len = allLayer.length; i < len; i++) {
                var layerobj = allLayer[i];
                if (layerobj.Name == layerName) {
                    extent = layerobj.BoundingBox[0].extent;
                    //We recover the BBOX of the layer
                    self.setMapCenter(extent);
                    break;
                }
            }
        });
    };
    /**
     * Lets you zoom in on a list of layers by adjusting the zoom to the extent of the layer
     * @param {Array} idsLayers - Layer ID list (returned by addLayer ())
     */
    this.zoomToLayers = function (idsLayers) {
        var allExtent = [];
        //We recover the extent of all layers
        self.getCap(function (myGetCap) {
            allLayer = myGetCap.Capability.Layer.Layer;
            var extent;
            $.each(idsLayers, function (index, item) {
                layerName = mapLayers.get(item).getSource().getParams('LAYERS').LAYERS;
                for (var i = 0, len = allLayer.length; i < len; i++) {
                    var layerobj = allLayer[i];
                    if (layerobj.Name == layerName) {
                        extent = layerobj.BoundingBox[0].extent;
                        //We recover the BBOX of the layer
                        allExtent.push(extent);
                    }
                }
            });
            if (allExtent.length <= 0) {
                console.log('Aucune extent trouv\xE9e');
                return;
            }
            var newExtent = allExtent[0];
            //We take the 1st as reference
            $.each(allExtent, function (index, item) {
                // And we recover the max extent of all
                if (item[0] < newExtent[0]) {
                    newExtent[0] = item[0];
                }
                if (item[1] < newExtent[1]) {
                    newExtent[1] = item[1];
                }
                if (item[2] > newExtent[2]) {
                    newExtent[2] = item[2];
                }
                if (item[3] > newExtent[3]) {
                    newExtent[3] = item[3];
                }
            });
            self.setMapCenter(newExtent);
        });    //And now we keep the highest value of exten
    };
    /**
     * Modify the opacity of a layer
     * @param {string} idLayer - The ID of the layer (returned by addLayer ())
     * @param {float} opacity - The opacity to apply on the layer
     */
    this.changeOpacity = function (idLayer, opacity) {
        mapLayers.get(idLayer).setOpacity(opacity);
    };
    /**
     * Change the display order of a layer
     * @param {string} idLayer - The ID of the layer (returned by addLayer ())
     * @param {int} index - Change the display order of a layer
     */
    this.changeLayerIndex = function (idLayer, index) {
        idLayer = parseInt(idLayer);
        mapLayers.get(idLayer).setZIndex(index);
    };
    /**
     *Lets you change the visibility of a layer list
     * @param {Array of IdlayerName} arrayOfLayer - Array of ID layer (can also be just an ID layer)
     * @param {bool} visibility - true to make visible, false otherwise
     */
    this.setLayerVisibility = function (arrayOfIDLayer, visibility) {
        if ($.isArray(arrayOfIDLayer)) {
            arrayOfIDLayer = arrayOfIDLayer.map(parseInt);
            $.each(arrayOfIDLayer, function (index, value) {
                mapLayers.get(value).setVisible(visibility);
            });
        } else {
            //If we passed just the name of the layer and not an array, we rapel the function in array mode
            self.setLayerVisibility([parseInt(arrayOfIDLayer)], visibility);
        }
    };
    /**
     * Lets you update the value of a parameter for a layer
     * @param {string} idLayer - The ID of the layer (returned by addLayer ())
     * @param {string} paramName - The name of the parameter
     * @param {string} value - The value of the parameter
     */
    this.updateParam = function (idLayer, paramName, value) {
        var params = {};
        //If I do not create my before, the updateParams does not want it.
        params[paramName] = value;
        mapLayers.get(idLayer).getSource().updateParams(params);
    };
    /**
     * Returns the source of a layer
     * @param {string} idLayer - The ID of the layer (returned by addLayer ())
     */
    this.getSource = function (idLayer) {
        return mapLayers.get(idLayer).getSource();
    };
    /**
     * Update the size of the div of the map
     */
    this.updateDivMapSize = function () {
        //Adapts the size of the map
        var Hmap = $(window).height();
        $('#' + self.mapDiv).height(Hmap);
    };
    /**
     * Create a list of all available baseMap
     */
    this.initBaseMap = function () {
        baseMap = {};
        baseMap['OSM'] = new ol.layer.Tile({
            title: 'OSM',
            preload: Infinity,
            source: new ol.source.OSM({ crossOrigin: null }),
            visible: false
        });
        baseMap['Bing Aerial'] = new ol.layer.Tile({
            title: 'Bing Aerial',
            preload: Infinity,
            visible: false,
            source: new ol.source.BingMaps({
                key: keyBing,
                imagerySet: 'Aerial'
            })
        });
        baseMap['Bing Road'] = new ol.layer.Tile({
            title: 'Bing Road',
            preload: Infinity,
            visible: false,
            source: new ol.source.BingMaps({
                key: keyBing,
                imagerySet: 'Road'
            })
        });
        baseMap['Stamen Toner'] = new ol.layer.Tile({
            title: 'Stamen Toner',
            preload: Infinity,
            source: new ol.source.Stamen({ layer: 'toner' }),
            visible: false
        });
        baseMap['Stamen Watercolor'] = new ol.layer.Tile({
            title: 'Stamen Watercolor',
            preload: Infinity,
            source: new ol.source.Stamen({ layer: 'watercolor' }),
            visible: false
        });
        baseMap['Stamen Terrain'] = new ol.layer.Tile({
            title: 'Stamen Terrain',
            preload: Infinity,
            source: new ol.source.Stamen({ layer: 'terrain' }),
            visible: false
        });
        baseMap['Mapbox Geography'] = new ol.layer.Tile({
            title: 'Mapbox Geography',
            preload: Infinity,
            source: new ol.source.TileJSON({ url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure' }),
            visible: false
        });
        baseMap['Mapbox Natural earth'] = new ol.layer.Tile({
            title: 'Mapbox Natural earth',
            preload: Infinity,
            source: new ol.source.TileJSON({ url: 'https://api.tiles.mapbox.com/v3/mapbox.natural-earth-hypso-bathy.json?secure' }),
            visible: false
        });
    };
    /**
     * Returns the list of baseMap
     */
    this.getBaseMaps = function () {
        return baseMap;
    };
    /**
     * Change the baseMap to display
     * @param {string} baseMapName - name / key of the baseMap
     */
    this.changeBaseMap = function (baseMapName) {
        $.each(self.getBaseMaps(), function (name, source) {
            source.setVisible(false);
            // on les passes tous à false
            if (name == baseMapName) {
                //Et si on tombe sur la demandé, on la force à true
                source.setVisible(true);
                mapLayers.set(0, source);
            }
        });
    }    /**
 * END OF geoMap Object
 */;
};
var jsonWriter = function (cookiesMapName) {
    var self = this;
    var jsonVersion = '1.0';
    var jsonObj = {};
    var cookiesKeyActualMap = cookiesMapName;
    /************************
     * GENERAL
     */
    /**
     * Retourne l'objet JSON
     */
    this.getJsonObj = function () {
        return jsonObj;
    };
    /**
     * Retourne le JSON sous forme de String
     */
    this.getJsonString = function () {
        return JSON.stringify(jsonObj);
    };
    /**
     * Permet de lire un cookie
     * @param {String} name - nom du cookie
     */
    var readCookie = function (name) {
        var nameEQ = name + '=';
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ')
                c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0)
                return c.substring(nameEQ.length, c.length);
        }
        return null;
    };
    /**
     * Permet de retourner le cookie correspondant à la config du layermanager
     */
    this.readMapCookie = function () {
        return readCookie(cookiesKeyActualMap);
    };
    /**
     * Permet de supprimer le cookie coorespondant à la config du layerManager afin de recommencer un carte vide au besoin
     */
    this.clearMapCookie = function () {
        $.removeCookie(cookiesKeyActualMap);
    };
    /**
     * permet d'écrir/écraser le cookie correspondant à la config du layermanager
     * (a appeler après toutes modification !)
     */
    this.writeConfigCookies = function () {
        self.setMapName(cookiesKeyActualMap);
        var expiration_date = new Date();
        var cookie_string = '';
        expiration_date.setFullYear(expiration_date.getFullYear() + 1);
        cookie_string = cookiesKeyActualMap + '=' + self.getJsonString() + '; expires=' + expiration_date.toUTCString();
        ;
        document.cookie = cookie_string;
    };
    this.setIdMap = function (id) {
        jsonObj.mapID = id;
    };
    this.setMapName = function (mapName) {
        jsonObj.mapName = mapName;
    };
    /**
     * SETTER
     * Les fonctions suivantes permettent de mettre à jour l'objet JSON
     * Elles mettent automatiquement le cookie à jour
     */
    /**
     * Ecrit l'URL du GeoServer
     * @param {String} geoserver - L'URL du geoserver
     */
    this.geoServer = function (geoserver) {
        jsonObj.geoserver = geoserver.toString();
        self.writeConfigCookies();
    };
    /**
     * Ecrit le nom du créateur de la carte
     * @param {String} ownerName - Le créateur de la carte
     */
    this.ownerName = function (ownerName) {
        jsonObj.ownerName = ownerName.toString();
        self.writeConfigCookies();
    };
    /**
     * Ecrit le nom de la personne qui a modifié la carte 
     * @param {String} userName - Nom du propriétaire de la carte
     */
    this.userName = function (userName) {
        jsonObj.userName = userName.toString();
        self.writeConfigCookies();
    };
    /**
     * Ecrit la date de création de la carte
     * //TODO : Ne devrait jamais être appeler par l'utilisateur
     * @param {String} creationDate - Date de création de la carte
     */
    var creationDate = function (creationDate) {
        jsonObj.creationDate = creationDate.toString();
        self.writeConfigCookies();
    };
    /**
     * Ecrit la date de dernière modification de la carte
     * @param {String} lastModificationDate - Date de dernière modification de la carte
     */
    this.lastModificationDate = function (lastModificationDate) {
        jsonObj.lastModificationDate = lastModificationDate.toString();
        self.writeConfigCookies();
    };
    /**
     * Ecrit le nom de la carte
     * @param {String} mapName - Nom de la carte
     */
    this.mapName = function (mapName) {
        jsonObj.mapName = mapName.toString();
        self.writeConfigCookies();
    };
    /**
     * Ecrit le titre de la carte
     * @param {String} mapTitle - Titre de la carte
     */
    this.mapTitle = function (mapTitle) {
        jsonObj.mapTitle = mapTitle.toString();
        self.writeConfigCookies();
    };
    /**
     * Ecrit l'identifiant unique de la carte. Doit correspondre avec l'ID de la carte en base
     * @param {int} mapID - Identifiant de la carte
     */
    this.mapID = function (mapID) {
        jsonObj.mapID = mapID.toString();
        self.writeConfigCookies();
    };
    /**
     * Ecrit le status de partage de la carte
     * ublic (Read), private (seulement le userName), share (Read - liste personne; R/W - liste personne)
     * @param {String} shareStatus - Status de partage de la carte
     */
    this.shareStatus = function (shareStatus) {
        jsonObj.shareStatus = shareStatus.toString();
        self.writeConfigCookies();
    };
    /************************
     * LAYERS
     */
    /**
     * Permet d'ajouter un layer 
     * Si le layer existe déjà, celui ci est retourné.
     * @param {int} layerId - ID du layer (doit être unique)
     * @param {String} layerName - Nom du layer (workspace:layername)
     * @param {String} layerDisplayName - Nom affiché du layer
     * @param {String} layerGroupName - Nom du groupe du layer
     * @param {int} layerOrderInGroup - L'ordre du layer dans son groupe
     * @param {bool} active  - Si le layer est activé
     * @param {bool} visibility - Visibilité du layer
     * @param {float} opacity - Opacité du layer
     */
    this.newLayer = function (layerId, layerName, layerDisplayName, layerGroupName, layerOrderInGroup, active, visibility, opacity) {
        //Si c'est le premier layer, on initialise la liste
        if (jsonObj.layers === undefined) {
            jsonObj.layers = [];
        }
        layerId = parseInt(layerId);
        //Si le layer existe déjà, on le retourne, on ne l'écrase pas.
        //Pour ecraser un layer, on passera par le setter de celui ci
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            });
        if (indexLayer > -1) {
            return jsonObj.layers[indexLayer];
        }
        indexLayer = jsonObj.layers.length;
        jsonObj.layers[indexLayer] = {};
        jsonObj.layers[indexLayer].layerId = layerId;
        jsonObj.layers[indexLayer].layerName = layerName;
        jsonObj.layers[indexLayer].layerDisplayName = layerDisplayName;
        jsonObj.layers[indexLayer].layerGroupName = layerGroupName;
        jsonObj.layers[indexLayer].layerOrderInGroup = layerOrderInGroup;
        jsonObj.layers[indexLayer].active = active;
        jsonObj.layers[indexLayer].visibility = visibility;
        jsonObj.layers[indexLayer].opacity = opacity;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];
    };
    /**
     * Met à jour le nom affiché du layer
     * @param {int} layerId - id du layer
     * @param {string} newLayerDisplayName - Nom affiché du layer
     */
    this.setlayerDisplayName = function (layerId, newLayerDisplayName) {
        layerId = parseInt(layerId);
        //Si aucun layer n'est présent
        if (jsonObj.layers === undefined || jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            }) <= -1) {
            return undefined;
        }
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            });
        jsonObj.layers[indexLayer].layerDisplayName = newLayerDisplayName;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];
    };
    /**
     * Met à jour le nom du groupe du layer
     * @param {int} layerId - ID du layer
     * @param {String} newLayerGroupName - Nom du groupe du layer
     */
    /*this.setLayerGroupName = function(layerId, newLayerGroupName){
        layerId = parseInt(layerId)
        //Si aucun layer n'est présent
        if(jsonObj.layers === undefined || (jsonObj.layers.findIndex(l => l.layerId === layerId)<= -1) ){return undefined;}
        var indexLayer = jsonObj.layers.findIndex(l => l.layerId === layerId);
        jsonObj.layers[indexLayer].layerGroupName = newLayerGroupName;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];        
    }*/
    /**
     * Met à jour l'ordre du layer dans son groupe
     * @param {int} layerId - ID du layer
     * @param {String} newLayerOrderInGroup - L'ordre du layer dans son groupe
     */
    this.setLayerOrderInGroup = function (layerId, newLayerOrderInGroup) {
        layerId = parseInt(layerId);
        //Si aucun layer n'est présent
        if (jsonObj.layers === undefined || jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            }) <= -1) {
            return undefined;
        }
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            });
        jsonObj.layers[indexLayer].layerOrderInGroup = newLayerOrderInGroup;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];
    };
    this.setOpacity = function (layerId, newOpacity) {
        layerId = parseInt(layerId);
        //Si aucun layer n'est présent
        if (jsonObj.layers === undefined || jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            }) <= -1) {
            return undefined;
        }
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            });
        jsonObj.layers[indexLayer].opacity = newOpacity;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];
    };
    /**
     * Met à jour le layer active/inactif
     * @param {int} layerId - ID du layer
     * @param {bool} newActive - Si le layer est activé
     */
    this.setActive = function (layerId, newActive) {
        layerId = parseInt(layerId);
        //Si aucun layer n'est présent
        if (jsonObj.layers === undefined || jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            }) <= -1) {
            return undefined;
        }
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            });
        jsonObj.layers[indexLayer].active = newActive;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];
    };
    /**
     * Met à jour la visibilité du layer
     * @param {int} layerId - ID du layer
     * @param {bool} newVisibility - Visibilité du layer
     */
    this.setVisibility = function (layerId, newVisibility) {
        layerId = parseInt(layerId);
        //Si aucun layer n'est présent
        if (jsonObj.layers === undefined || jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            }) <= -1) {
            return undefined;
        }
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            });
        jsonObj.layers[indexLayer].visibility = newVisibility;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];
    };
    /**
     * Met à jour l'opacité du layer
     * @param {int} layerId - ID du layer
     * @param {float} newOpacity - Opacité du layer
     */
    this.setOpacity = function (layerId, newOpacity) {
        layerId = parseInt(layerId);
        //Si aucun layer n'est présent
        if (jsonObj.layers === undefined || jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            }) <= -1) {
            return undefined;
        }
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            });
        jsonObj.layers[indexLayer].opacity = newOpacity;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];
    };
    this.setExtent = function (extent, epsg) {
        jsonObj.extent = extent;
        jsonObj.extentEPSG = epsg;
        self.writeConfigCookies();
    };
    this.setZoom = function (newZoom) {
        jsonObj.zoom = newZoom;
    };
    /**
     * 
     * @param {*} layerId 
     */
    this.removeLayer = function (layerId) {
        layerId = parseInt(layerId);
        //Si aucun layer n'est présent
        if (jsonObj.layers === undefined || jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            }) <= -1) {
            return undefined;
        }
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l) {
                return l.layerId === layerId;
            });
        jsonObj.layers.splice(indexLayer, 1);
        self.writeConfigCookies();    //delete jsonObj.layers[indexLayer];
    };
    this.forceRemoveAllLayer = function () {
        jsonObj.layers = [];
        self.writeConfigCookies();
    };
    /************************
     * GROUPS
     */
    /**
     * Permet d'ajouter un group.
     * Si le groupe existe déjà, celui ci est retourné
     * @param {String} groupName - Id du groupe 
     * @param {String} groupDisplayName - Nom affiché du groupe
     * @param {int} groupOrder - Ordre du group
     * @param {bool} groupActive - Si le groupe est actif
     * @param {bool} groupVisibility - Si le gorup est visible
     */
    this.newLayerGroup = function (groupName, groupDisplayName, groupOrder, groupActive, groupVisibility) {
        //Si c'est le premier layerGroup, on initialise la liste
        if (jsonObj.layerGroups === undefined) {
            jsonObj.layerGroups = [];
        }
        //Si le group existe déjà, on le retourne, on ne l'écrase pas.
        //Pour ecraser un group, on passera par le setter de celui ci
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            });
        if (indexGroup > -1) {
            return jsonObj.layerGroups[indexGroup];
        }
        indexGroup = jsonObj.layerGroups.length;
        jsonObj.layerGroups[indexGroup] = {};
        jsonObj.layerGroups[indexGroup].groupName = groupName;
        jsonObj.layerGroups[indexGroup].groupDisplayName = groupDisplayName;
        jsonObj.layerGroups[indexGroup].groupOrder = groupOrder;
        jsonObj.layerGroups[indexGroup].groupActive = groupActive;
        jsonObj.layerGroups[indexGroup].groupVisibility = groupVisibility;
        self.writeConfigCookies();
        return jsonObj.layerGroups[indexGroup];
    };
    this.setGroupDisplayName = function (groupName, newGroupDisplayName) {
        //Si aucun layer n'est présent
        if (jsonObj.layerGroups === undefined || jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            }) <= -1) {
            return undefined;
        }
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            });
        jsonObj.layerGroups[indexGroup].groupDisplayName = newGroupDisplayName;
        self.writeConfigCookies();
        return jsonObj.layerGroups[indexGroup];
    };
    this.setGroupOrder = function (groupName, newGroupOrder) {
        //Si aucun layer n'est présent
        if (jsonObj.layerGroups === undefined || jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            }) <= -1) {
            return undefined;
        }
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            });
        jsonObj.layerGroups[indexGroup].groupOrder = newGroupOrder;
        self.writeConfigCookies();
        return jsonObj.layerGroups[indexGroup];
    };
    this.setGroupActive = function (groupName, newGroupActive) {
        //Si aucun layer n'est présent
        if (jsonObj.layerGroups === undefined || jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            }) <= -1) {
            return undefined;
        }
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            });
        jsonObj.layerGroups[indexGroup].groupActive = newGroupActive;
        self.writeConfigCookies();
        return jsonObj.layerGroups[indexGroup];
    };
    this.setGroupVisibility = function (groupName, newGroupVisibility) {
        //Si aucun layer n'est présent
        if (jsonObj.layerGroups === undefined || jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            }) <= -1) {
            return undefined;
        }
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            });
        jsonObj.layerGroups[indexGroup].groupVisibility = newGroupVisibility;
        self.writeConfigCookies();
        return jsonObj.layerGroups[indexGroup];
    };
    /**
     * Met à jour le group ouvert/replié
     * @param {int} groupName - ID du layer
     * @param {bool} minimize - Si le layer est activé
     */
    this.setMinmizeGroupe = function (groupName, minimize) {
        //Si aucun group n'est présent
        if (jsonObj.layerGroups === undefined || jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            }) <= -1) {
            return undefined;
        }
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            });
        jsonObj.layerGroups[indexGroup].minimize = minimize;
        self.writeConfigCookies();
        return jsonObj.layerGroups[indexGroup];
    };
    this.setActiveGroup = function (groupName, active) {
        //Si aucun group n'est présent
        if (jsonObj.layerGroups === undefined || jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            }) <= -1) {
            return undefined;
        }
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            });
        jsonObj.layerGroups[indexGroup].groupActive = active;
        self.writeConfigCookies();
        return jsonObj.layerGroups[indexGroup];
    };
    /**
     * 
     * @param {*} groupName 
     */
    this.removeGroup = function (groupName) {
        //Si aucun group n'est présent
        if (jsonObj.layerGroups === undefined || jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            }) <= -1) {
            return undefined;
        }
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l) {
                return l.groupName === groupName;
            });
        jsonObj.layerGroups.splice(indexGroup, 1);
        self.writeConfigCookies();    //delete jsonObj.layers[indexLayer];
    };
    this.forceRemoveAllGroup = function () {
        jsonObj.layerGroups = [];
        self.writeConfigCookies();
    };
    /************************
     * BASEMAP
     */
    /**
     * Permet d'ajouter un fond de plan (baseMap).
     * Si le baseMap existe déjà, celui ci est retourné
     * @param {String} baseMapName - Nom du baseMap
     * @param {float} opacity - Opacité du baseMap
     * @param {bool} active - Si le baseMap est actif
     */
    this.newBaseMap = function (baseMapName, opacity, active) {
        //Si le baseMap existe déjà, on le retourne, on ne l'écrase pas.
        //Pour ecraser un baseMap, on passera par le setter de celui ci
        if (jsonObj.baseMap !== undefined) {
            return jsonObj.baseMap;
        }
        jsonObj.baseMap = {};
        jsonObj.baseMap.baseMapName = baseMapName;
        jsonObj.baseMap.opacity = opacity;
        jsonObj.baseMap.active = active;
        self.writeConfigCookies();
        return jsonObj.baseMap;
    };
    /**
     * Met à jour le nom / la source du base map
     * @param {String} newBaseMapName - Nom du baseMap
     */
    this.setBaseMapName = function (newBaseMapName) {
        if (jsonObj.baseMap === undefined) {
            return undefined;
        }
        jsonObj.baseMap.baseMapName = newBaseMapName;
        self.writeConfigCookies();
        return jsonObj.baseMap;
    };
    /**
     * Met à jour l'opacité du baseMap
     * @param {float} newOpacity - Opacité du baseMap
     */
    this.setBaseMapOpacity = function (newOpacity) {
        if (jsonObj.baseMap === undefined) {
            return undefined;
        }
        jsonObj.baseMap.opacity = newOpacity;
        self.writeConfigCookies();
        return jsonObj.baseMap;
    };
    /**
     * Met à jour le baseMap actif/inactif
     * @param {bool} newActive - true si le baseMap doit être actif
     */
    this.setBaseMapActive = function (newActive) {
        if (jsonObj.baseMap === undefined) {
            return undefined;
        }
        jsonObj.baseMap.active = newActive;
        self.writeConfigCookies();
        return jsonObj.baseMap;
    }    /************************
     * GENERAL
     */
         /**
     * END OF jsonWriter Object
     */;
};
var layerManager = function (div, geoMap, jsonWriter, dimensionSlider, library, layerManagerConfig) {
    var self = this;
    this.lmDiv = div;
    var jqueryLMDiv = $('#' + this.lmDiv);
    var jqueryCLDiv = $('#' + this.lmDiv).append('<div id=\'contenairList\' class=\'\'></div>').find('#contenairList');
    var jqueryCCDiv = $('#' + this.lmDiv).append('<div id=\'contenairConfig\' class=\'bgColor2\'></div>').find('#contenairConfig');
    var jqueryLayerListDiv = jqueryCLDiv.append('<div id=\'layerList\' class=\'layer-list\'></div>').find('#layerList');
    var jquerybaseMapDiv = jqueryCCDiv.append('<div id=\'baseMap\' ></div>').find('#baseMap');
    var jqueryCRUDDiv = jqueryCCDiv.append('<div id=\'CRUD\' ></div>').find('#CRUD');
    this.geoMap = geoMap;
    this.jsonWriter = jsonWriter;
    this.dimensionSlider = dimensionSlider;
    this.library = library;
    var layerManagerConfig = layerManagerConfig;
    var groupOrder = 1;
    var startGroupOrder = groupOrder;
    var layerListDiv;
    var curdDiv;
    var demultiplicateurOrderLayer = 1000;
    var layerCapabilities = {};
    var layersList = [];
    var groupIds = {};
    var groupsList = {};
    var groupId = 1;
    this.getGroup = function () {
        return groupIds;
    };
    /**
     * Launch Initialization functions
     */
    this.init = function () {
        self.geoMap.addCallbackOnMoveMap(actionOnMoveMap);
        if (dimensionSlider !== undefined) {
            dimensionSlider.setCallbackUpdateParam(self.geoMap.updateParam);
            dimensionSlider.setCallbackChangeVisiblity(self.setActiveLayer);    // dimensionSlider.setCallbackChangeVisiblity(self.setEyeVisibility);
        }
    };
    /**
     * Remove all layers present in the layerManager
     */
    this.removeAllLayer = function () {
        var idLayer = [];
        jqueryLayerListDiv.find('.layer-conf').each(function () {
            trashLayer($(this).attr('id'), $(this));
        });
        groupOrder = startGroupOrder;
        self.jsonWriter.forceRemoveAllGroup();
        self.jsonWriter.forceRemoveAllLayer();
    };
    this.removeLayerManager = function () {
        self.removeAllLayer();
        jqueryLMDiv.html('');
        jqueryLMDiv = $('#' + this.lmDiv);
        jqueryLayerListDiv = $('#' + this.lmDiv).append('<div id=\'layerList\' class=\'layer-list\'></div>').find('#layerList');
        jquerybaseMapDiv = $('#' + this.lmDiv).append('<div id=\'baseMap\' ></div>').find('#baseMap');
        jqueryCRUDDiv = $('#' + this.lmDiv).append('<div id=\'CRUD\' ></div>').find('#CRUD');
    };
    /**
     * Geomap callback function to perform an action each time the user moves the map
     * @param {int} zoom - Current zoom of the map
     * @param {Array} extent - Float Array representing the extent of the map
     * @param {String} epsg - EPSG of the map
     */
    var actionOnMoveMap = function (zoom, extent, epsg) {
        self.jsonWriter.setZoom(zoom);
        self.jsonWriter.setExtent(extent, epsg);
    };
    /**
     * Create and add the 3 buttons (backup / openMap / LoadLayers)
     * @param {function} onAddLayer - Callback which will be called when the user clicks on "loadLayers". This callback is managed by the object Library
     */
    this.addCrud = function (onAddLayer, onSaveMap, onLoadMap, div) {
        divCRUD = '<div class="CRUD-layer-manager">             <span class="fa-stack fa-lg fa-2x bgColor1" id="saveMap" data-toggle="tooltip" title="' + trans['layerManagerSaveMap'] + '">                 <i class="fa fa-floppy-o fa-stack-1x animated bgColor1 color2Hover"></i>             </span>             <span class="fa-stack fa-lg fa-2x bgColor1" id="openMap" data-toggle="tooltip" title="' + trans['layerManagerOpenMap'] + '">                 <i class="fa fa-folder-open-o fa-stack-1x animated  bgColor1 color2Hover"></i>             </span>             <span class="fa-stack fa-lg fa-2x bgColor1" id="addMap" data-toggle="tooltip" title="' + trans['layerManagerAddLayer'] + '">                 <i class="fa fa-plus fa-stack-1x animated  bgColor1 color2Hover"></i>             </span>             <span class="fa-stack fa-lg fa-2x bgColor1" id="removeAllLayers" data-toggle="tooltip" title="' + trans['layerManagerRemoveAllLayer'] + '">                 <i class="fa fa-trash fa-stack-1x animated bgColor1 color2Hover"></i>             </span>         </div>';
        if (div !== undefined) {
            newDiv = $(div).append(divCRUD);
        } else {
            newDiv = jqueryCRUDDiv.append(divCRUD);
        }
        newDiv.find('#saveMap').click(function () {
            onSaveMap(self.jsonWriter.getJsonString());
        });
        newDiv.find('#openMap').click(function () {
            onLoadMap(self.loadJsonMap);
        });
        newDiv.find('#addMap').click(function () {
            onAddLayer();
        });
        newDiv.find('#removeAllLayers').click(function () {
            var confirmRemove = confirm(trans['layerManagerConfirmRemoveAll']);
            if (confirmRemove) {
                self.removeAllLayer();
            }
        });
        jqueryCRUDDiv = newDiv;
    };
    /**
     * Add a layer in the layerManager and to the map
     * @param {String} layerName - Layer name in the getCap (workspace:layername)
     * @param {String} layerDisplayName - Display name of the layer layerManager
     * @param {int} forceGroupOrder - Force group order
     */
    this.addLayer = function (layerName, layerDisplayName, layerGroupDisplayName, forceGroupOrder, server) {
        console.log(layerName + ' - ' + layerDisplayName + ' - ' + layerGroupDisplayName + ' - ' + forceGroupOrder + ' - ' + server);
        layerCap = self.library.getLayerCapabilities(layerName);
        if (layerDisplayName == '' || layerDisplayName === undefined) {
            layerDisplayName = layerCap === undefined || layerCap.Title === undefined || layerCap.Title == '' ? layerName : layerCap.Title;
        }
        if (layerGroupDisplayName == '' || layerGroupDisplayName === undefined) {
            //If the groupName has already been added, the groupDisplayName will not be taken into account!
            layerGroupDisplayName = trans['standardGroupName'];
        }
        groupDiv = getOrCreateGroupDiv(layerGroupDisplayName, forceGroupOrder);
        var currentGroupId = groupDiv.attr('id');
        actualOrderGroup = groupDiv.data('ordergroup');
        var orderSubGroup = (groupDiv.find('.layer-conf').length + 1) / demultiplicateurOrderLayer;
        //TODO : s'il y a plus de 1000 layer dans un group on va avoir un problème
        thisOrder = actualOrderGroup + orderSubGroup;
        //Check if the max number of layers in a group (demultiplicateurOrderLayer) is reached 
        var MaxOrderInGroup = 0;
        $.each(getAllIdLayersGroup(currentGroupId), function (index, idLayer) {
            self.dimensionSlider.updateLayer(idLayer);
            var currentOrder = self.getOrderLayer(idLayer);
            if (currentOrder > MaxOrderInGroup) {
                MaxOrderInGroup = currentOrder;
            }
        });
        MaxOrderInGroup = MaxOrderInGroup * demultiplicateurOrderLayer - parseInt(MaxOrderInGroup) * demultiplicateurOrderLayer;
        if (MaxOrderInGroup >= demultiplicateurOrderLayer - 1) {
            console.log('Le nombre maxi de couche dans le groupe \xE0 \xE9t\xE9 atteint');
            return null;
        }
        if (typeof layerCap === 'undefined' || layerCap === null) {
            console.log('Error : Le layer ' + layerName + ' n\'est pas disponible');
            newDiv = createUnavailableLayerDiv(thisOrder, layerName);
            groupDiv.find('#layers').prepend(newDiv);
            addTrashEvent(thisOrder, newDiv);
            return null;
        }
        idLayer = geoMap.addLayer(layerName, server);
        //We add the layer to the map and we get its unique identifier generated by the geoMap object.
        self.setOrderLayer(idLayer, thisOrder);
        // We set the zIndex of the layer (to control everything)
        idLayer = parseInt(idLayer);
        //We parse in int to be on but it is almost useless
        layerCapabilities[idLayer] = layerCap;
        layersList.push([idLayer, layerName, layerDisplayName, layerGroupDisplayName]);
        newDiv = createLayerDiv(idLayer, layerName, layerDisplayName, thisOrder);
        //We create the div for the new layer
        groupDiv.find('#layers').prepend(newDiv);
        // and we add it to the list
        self.sortDivGroup();
        if (self.dimensionSlider !== undefined) {
            self.dimensionSlider.sliderAddLayer(idLayer, layerCap);
            self.dimensionSlider.updateElevSlider(idLayer);
            self.dimensionSlider.updateTimeSlider(idLayer);
        }
        self.setActiveLayer(idLayer, layerManagerConfig.defaultLayerActive);
        self.setOpacity(idLayer, layerManagerConfig.defaultOpacity);
        //self.setEyeVisibility(idLayer, layerManagerConfig.defaultLayerActive);
        jsonWriter.newLayer(idLayer, layerName, layerDisplayName, currentGroupId, thisOrder, true, true, 1);
        // We update the json with this layer
        //We add the different events on the div of the layer
        addOpacityEvent(idLayer, newDiv);
        addUpEvent(idLayer, newDiv);
        addDownEvent(idLayer, newDiv);
        addActiveClickEvent(idLayer, newDiv);
        addTrashEvent(idLayer, newDiv);
        addZoomLayerEvent(idLayer, newDiv);
        addDisplayLegend(idLayer, newDiv);
        addChangeLayerNameEvent(idLayer, newDiv);
        onLayerLoading(idLayer, newDiv);
        onLayerIsLoad(idLayer, newDiv);
        //We return the id of the layer
        return idLayer;
    };
    var onLayerLoading = function (idLayer, div) {
        self.geoMap.onLayerLoading(idLayer, function () {
            $(div).find('.loadingLayer').show();
            $(div).find('#eyeVisibility').hide();
        });
    };
    var onLayerIsLoad = function (idLayer, div) {
        self.geoMap.onLayerIsLoading(idLayer, function () {
            $(div).find('.loadingLayer').hide();
            $(div).find('#eyeVisibility').show();
        });
        $('[data-toggle="tooltip"]').tooltip();
    };
    var getOrCreateGroupDiv = function (layerGroupDisplayName, forceGroupOrder) {
        var idGroup = groupIds[layerGroupDisplayName];
        //If the group already exists
        if (idGroup != undefined && idGroup != '') {
            var div = jqueryLayerListDiv.find('.group-div#' + idGroup);
            if (div.length) {
                return div;
            }
        }
        //otherwise, create a new one
        var groupDiv = createGroup(layerGroupDisplayName, forceGroupOrder);
        jqueryLayerListDiv.prepend(groupDiv);
        return groupDiv;
    };
    var createGroup = function (layerGroupDisplayName, forceGroupOrder) {
        groupId = groupId + 1;
        groupIds[layerGroupDisplayName] = groupId;
        groupOrder = groupOrder + 1;
        actualGroupOrder = groupOrder;
        if (forceGroupOrder != undefined && forceGroupOrder > -1) {
            actualGroupOrder = forceGroupOrder;
            if (forceGroupOrder > groupOrder) {
                groupOrder = forceGroupOrder + 1;    //to make sure that the next groups created do not encroach on already created groupOrder
            }
        }
        div = createGroupeDiv(groupId, actualGroupOrder, layerGroupDisplayName);
        addZoomGroupEvent(groupId, div);
        addMinimizeGroupEvent(groupId, div);
        addChangeGroupNameEvent(groupId, div);
        addTrashGroupEvent(groupId, div);
        addActiveGroupEvent(groupId, div);
        addUpGroupEvent(groupId, div);
        addDownGroupEvent(groupId, div);
        self.jsonWriter.newLayerGroup(groupId, layerGroupDisplayName, actualGroupOrder, true, true);
        return $(div);
    };
    var createGroupeDiv = function (idGroup, actualGroupOrder, layerGroupDisplayName) {
        div = '<div class="group-div" id="' + idGroup + '" data-ordergroup="' + actualGroupOrder + '"><div class="group"><table width="100%" cellpadding="0" cellmargin="0" class="layer-conf "><tr><td class="cola"></td><td class="col2"></td><td class="col2b"></td><td class="col3 bgColor2Darker borderBottomColor2Darker"></td></tr></table></div><div id="layers"></div></div>';
        eyeVisibility = '<i id="gpEyeVisibility" class="fa fa-eye group-eye-visibility bgColor2" aria-hidden="true" data-toggle="tooltip" title="' + trans['hideGroup'] + '"></i>';
        minusGroup = '<i id="gpMinus" class="fa fa-minus group-minus bgColor2" aria-hidden="true" data-toggle="tooltip" title="' + trans['hideGroup'] + '"></i>';
        label = '<div class="group-name"><label Color2><b>' + layerGroupDisplayName + '</b></label></div>';
        zoomOn = '<i class="fa fa-search-plus group-zoom Color2" aria-hidden="true" id="zoomOn" data-toggle="tooltip" title="' + trans['zoomGroup'] + '"></i>';
        up = '<i class="fa fa-chevron-up Color2" aria-hidden="true" id="upGroup" data-toggle="tooltip" title="' + trans['upGroup'] + '"></i>';
        down = '<i class="fa fa-chevron-down Color2" aria-hidden="true" id="downGroup" data-toggle="tooltip" title="' + trans['upGroup'] + '"></i>';
        deleteGroup = '<i class="fa fa-trash trash-group bgColor2" aria-hidden="true" id="trashGroup" data-toggle="tooltip" title="' + trans['deleteGroup'] + '"></i>';
        newDiv = $(div);
        newDiv.find('.cola').append(eyeVisibility).append(minusGroup);
        newDiv.find('.col2').append(label);
        newDiv.find('.col2b').append(zoomOn).append(up).append(down);
        newDiv.find('.col3').append(deleteGroup);
        return newDiv;
    };
    /**
     * Allows the user to change the group name by clicking on it
     * @param {html} div  - Group div
     */
    var addChangeGroupNameEvent = function (groupId, div) {
        var argDiv = div;
        $(div).find('.group-name').find('label').unbind('click');
        $(div).find('.group-name').find('label').click(function () {
            var value = $(this).text();
            var new_html = '<input value="' + value + '"></input>';
            $(this).replaceWith(new_html);
            $(div).find('.group-name').find('input').focus();
            $(div).find('.group-name').find('input').keypress(function (ev) {
                var keycode = ev.keyCode ? ev.keyCode : ev.which;
                if (keycode == '13') {
                    changeGroupName(groupId, value, $(this), argDiv);
                }
            });
            $(div).find('.group-name').find('input').focusout(function () {
                changeGroupName(groupId, value, $(this), argDiv);
            });
        });
    };
    var changeGroupName = function (groupId, oldvalue, div, argDiv) {
        var newVal = $(div).val();
        if (groupIds[newVal] !== undefined && newVal != oldvalue) {
            alert('Ce group existe d\xE9j\xE0');
            newVal = oldvalue;
        } else {
            groupIds[newVal] = groupIds[oldvalue];
            delete groupIds[oldvalue];
        }
        var new_html = '<label><b>' + newVal + '</b></label>';
        self.jsonWriter.setGroupDisplayName($(argDiv).attr('id'), newVal);
        $(div).replaceWith(new_html);
        addChangeGroupNameEvent(groupId, argDiv);
    };
    var getLayersList = function () {
        return layersList;
    };
    /**
     * Returns an array containing the active layer Id.
     */
    this.getAllActiveLayer = function () {
        var layersArray = [];
        $.each(getLayersList(), function (index, item) {
            if (self.getActiveLayer(item[0])) {
                layersArray.push(item);
            }
        });
        return layersArray;
    };
    /**
     * Load a layer list returned by the library object
     * @param {list} layerList - layer list key: layerName, value: Capabilities of layer
     */
    this.loadLibraryLayers = function (layerList, groupName) {
        $.each(layerList, function (id, layerName) {
            self.addLayer(layerName, '', groupName);
        });
    };
    /**
     * Create a div in the layerManager for a new layer
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {String} layerName - Layer name (workspace: layername)
     * @param {String} layerDisplayName - Name of the layer displayed to the user
     * @param {int} dataOrder - Index of the layer (the more the index is strong, the more the layer is found above the others)
     */
    var createLayerDiv = function (idLayer, layerName, layerDisplayName, dataOrder) {
        //We create the different objects of the div
        div = '<div class="layer-conf" id="' + idLayer + '" data-layer="' + layerName + '" data-orderLayer="' + dataOrder + '"><table width="100%" cellpadding="0" cellmargin="0"><tr><td class="col1"></td><td class="col2"><div class="row line1"></div><div class="row line2 animated"></div></td><td class="col3 bgColor2Darker borderBottomColor2Darker"></td></tr></table></div>';
        eyeVisibility = '<i id="eyeVisibility" class="fa fa-eye eye-visibility color2darker" aria-hidden="true"  data-toggle="tooltip" data-layer="' + layerName + '" title="' + trans['hideLayer'] + '"></i>';
        loadingLayer = '<i class="fa fa-spinner fa-spin fa-fw loadingLayer" id="' + idLayer + '" style="display:none;"></i>';
        label = createLabel(layerDisplayName);
        //I did this for when the user will want changed the name I will reuse this function // '<label class = "col-md-10 animated color2 labelLayerName"> <b>' + layerDisplayName + '</ b> < / label> ';
        updownLayer = '<i class="fa fa-chevron-up color1" aria-hidden="true" id="upLayer" data-toggle="tooltip" title="' + trans['upLayer'] + '"></i><i class="fa fa-chevron-down color1" aria-hidden="true" id="downLayer"  data-toggle="tooltip" title="' + trans['downLayer'] + '"></i>';
        deleteLAyer = '<i class="fa fa-trash trash-layer color1" aria-hidden="true" id="trashLayer" data-toggle="tooltip" title="' + trans['deleteLayer'] + '"></i>';
        extractMenu = createExtractMenu();
        separator = '<span class="separator"></span>';
        zoomOn = '<i class="fa fa-search-plus zoom-layer color1" aria-hidden="true" id="zoomOn" data-toggle="tooltip" title="' + trans['zoomLayer'] + '"></i>';
        opacitySlider = '<input id="opacity"/><span class="opacity-percent" id="opacityPercent"></span>';
        legend = '<i class="fa fa-list get-legend color1" aria-hidden="true" id="getLegend" data-img="' + layerCapabilities[idLayer].Style[0].LegendURL[0].OnlineResource + '"></i>';
        //---We assemble all that
        newDiv = $(div);
        newDiv.find('.col1').append(eyeVisibility).append(loadingLayer);
        newDiv.find('.col2 .line1')    /*.append(active)*/.append(label);
        newDiv.find('.col2 .line2').append(separator).append(opacitySlider).append(zoomOn).append(legend).append(updownLayer);
        newDiv.find('.col3').append(deleteLAyer);
        //---L'aesthetic
        //the opacity slider
        newDiv.find('#opacity').slider({
            id: 'opacitySlider',
            class: 'gh-slider',
            value: 1,
            step: 0.05,
            min: 0,
            max: 1,
            tooltip: 'hide'
        });
        //And we return the new div correspsondante to the new layer
        return newDiv;
    };
    var createUnavailableLayerDiv = function (idLayer, layerName) {
        div = '<div class="layer-conf" id="' + idLayer + '" data-layer="' + layerName + '" data-orderLayer="-1"><table width="100%" cellpadding="0" cellmargin="0"><tr><td class="col1"></td><td class="col2"><div class="row line1"></div><div class="row line2 animated"></div></td><td class="col3 bgColor2Darker borderBottomColor2Darker"></td></tr></table></div>';
        eyeVisibility = '<i id="eyeVisibility" class="fa fa-eye-slash eye-visibility color2darker" aria-hidden="true"  data-toggle="tooltip" title="' + trans['hidenLayer'] + '"></i>';
        label = createLabel(layerName.replace(/\_/g, ' '));
        unavailableLabel = '<label class="col-md-10 animated color2 unavailableLabel">' + trans['unavailableLayer'] + '</label>';
        deleteLAyer = '<i class="fa fa-trash trash-layer color1" aria-hidden="true" id="trashLayer" data-toggle="tooltip" title="' + trans['deleteLayer'] + '"></i>';
        newDiv = $(div);
        newDiv.find('.col1').append(eyeVisibility);
        newDiv.find('.col2 .line1').append(label);
        newDiv.find('.col2 .line2').append(unavailableLabel);
        newDiv.find('.col3').append(deleteLAyer);
        return newDiv;
    };
    /**
     * Function which creates the label of a layer // TODO: do the same thing for the labels of the groups
     * This function is also called when renaming the layer name
     * @param {String} value    value to display
     */
    var createLabel = function (value) {
        return '<label class="col-md-10 animated labelLayerName"><b>' + value + '</b></label>';
    };
    /**
     * The menu plus for each layer
     * Not used at the moment
     */
    var createExtractMenu = function () {
        return '<div class="dropdown extract-menu pull-right">             <i class="fa fa-ellipsis-h dropdown-toggle" data-toggle="dropdown" aria-hidden="true" id="extractMenu"></i>             <ul class="dropdown-menu pull-left" role="menu" style="left:auto;">                 <li><a href="#">Renommer la couche</a></li>                 <li><a href="#">Autre action</a></li>             </ul>         </div>';
    };
    /**
     * Create the div containing the baseMap
     */
    this.createBaseMap = function () {
        //We create the different objects of the div
        div = '<div class="form-group base-map layer-conf" id="0"><table width="100%"><tr><td class="col1 bgColor2Darker"></td><td class="col2 animated"></td></tr></table></div>';
        //active = '<i class="fa fa-toggle-on color1" aria-hidden="true" id="active" data-toggle="tooltip" title="'+ trans["layerManagerHideMapBackground"] +'"></i>';
        eyeVisibility = '<i id="eyeVisibility" class="fa fa-eye eye-visibility color2darker" aria-hidden="true"  data-toggle="tooltip" title="' + trans['layerManagerHideMapBackground'] + '"></i>';
        baseMaps = $('<select class="form-control animated" id="baseMapSelect">');
        defaultBaseMapName = '';
        $.each(self.geoMap.getBaseMaps(), function (name, source) {
            value = name.split(' ').join('_');
            var option = $('<option value=' + value + '>' + name + '</option>');
            if (source.getVisible()) {
                option.attr('selected', true);
                defaultBaseMapName = name;
            }
            baseMaps = baseMaps.append(option);
        });
        baseMaps = baseMaps.append('</select>');
        opacitySlider = '<input id="opacity"/><span class="opacity-percent" id="opacityPercent"></span>';
        //---We assemble all that
        newDiv = $(div);
        newDiv.find('.col1').append(eyeVisibility);
        newDiv.find('.col2').append(baseMaps).append(opacitySlider);
        //---aesthetics
        //the opacity slider
        newDiv.find('#opacity').slider({
            id: 'opacitySlider',
            value: 1,
            step: 0.05,
            min: 0,
            max: 1,
            tooltip: 'hide'
        });
        jquerybaseMapDiv.append(newDiv);
        self.setActiveLayer(0, layerManagerConfig.defaultLayerActive);
        self.setOpacity(0, layerManagerConfig.defaultOpacity);
        //We add the different events on the div of the layer
        addOpacityEvent(0, newDiv);
        addActiveClickEvent(0, newDiv);
        addChangeBaseMapEvent(newDiv);
        self.jsonWriter.newBaseMap(defaultBaseMapName, 1, true);
        //And we return the new div correspsondante to the base Map
        return newDiv;
    };
    /***********
     * EVENT MANAGEMENT
     */
    /**
     * Click on the toggle of the layer
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - div of the layer
     */
    var addActiveClickEvent = function (idLayer, div) {
        $(div).find('#eyeVisibility').click(function () {
            if (self.getActiveGroupByIdLayer(idLayer) == false) {
                return;
            }
            self.setActiveLayer(idLayer, !$(this).hasClass('fa-eye'));
            if (self.dimensionSlider !== undefined && $(this).hasClass('fa-eye')) {
                //if the SliderSize are active and the layer has been activated,
                //we check that the slider accepts this layer otherwise we will gray out the eye (it is the dimensionSlider which will call the function to make the eye go gray)
                self.dimensionSlider.updateLayer(idLayer);
            }
        });
    };
    /**
     * Click on the zoom layer
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var addZoomLayerEvent = function (idLayer, div) {
        $(div).find('#zoomOn').click(function () {
            self.geoMap.zoomToLayer(idLayer);
        });
    };
    /**
     * Change opacity (slider)
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var addOpacityEvent = function (idLayer, div) {
        $(div).find('#opacity').change(function () {
            self.setOpacity(idLayer, $(this).val());
        });
    };
    /**
     * Click on up layer (The highest layer in the list is displayed on top of all other layers)
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var addUpEvent = function (idLayer, div) {
        $(div).find('#upLayer').click(function () {
            var orderLayer = parseFloat(div.attr('data-orderLayer'));
            var above = div.prev('.layer-conf');
            if (above.hasClass('layer-conf')) {
                newOrderLayer = parseFloat(above.attr('data-orderLayer'));
                self.setOrderLayer(above.attr('id'), orderLayer);
                self.setOrderLayer(idLayer, newOrderLayer);
            } else {
                //au dessus nok
                return;
            }
            self.sortDivLayer();
        });
    };
    /**
     * Click on down of the layer (The lowest layer in the list is displayed below all other layers)
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var addDownEvent = function (idLayer, div) {
        $(div).find('#downLayer').click(function () {
            var orderLayer = parseFloat(div.attr('data-orderLayer'));
            var next = div.next('.layer-conf');
            if (next.hasClass('layer-conf')) {
                newOrderLayer = parseFloat(next.attr('data-orderLayer'));
                self.setOrderLayer(next.attr('id'), orderLayer);
                self.setOrderLayer(idLayer, newOrderLayer);
            } else {
                //au dessus nok
                return;
            }
            self.sortDivLayer();
        });
    };
    /**
     * Allows the user to change the name of the layer by clicking on it
     * @param {int} idLayer  - The ID of the layer (returned by geoMap ())
     * @param {html} div  - Layer div
     */
    var addChangeLayerNameEvent = function (idLayer, div) {
        var argIdLayer = idLayer;
        var argDiv = div;
        $(div).find('.labelLayerName').unbind('click');
        $(div).find('.labelLayerName').click(function () {
            var value = $(this).text();
            var new_html = '<input class="inputLayerLayerName" value="' + value + '"></input>';
            $(this).replaceWith(new_html);
            $(div).find('.inputLayerLayerName').focus();
            $(div).find('.inputLayerLayerName').keypress(function (ev) {
                var keycode = ev.keyCode ? ev.keyCode : ev.which;
                if (keycode == '13') {
                    changeLayerName($(this), argIdLayer, argDiv);
                }
            });
            $(div).find('.inputLayerLayerName').focusout(function () {
                changeLayerName($(this), argIdLayer, argDiv);
            });
        });
    };
    var changeLayerName = function (div, argIdLayer, argDiv) {
        var newVal = $(div).val();
        var new_html = createLabel(newVal);
        self.jsonWriter.setlayerDisplayName(argIdLayer, newVal);
        $(div).replaceWith(new_html);
        addChangeLayerNameEvent(argIdLayer, argDiv);
    };
    /**
     * Click on the trash button
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var addTrashEvent = function (idLayer, div) {
        $(div).find('#trashLayer').click(function () {
            trashLayer(idLayer, div);
        });
    };
    /**
     * When the user changes baseMap
     * @param {html} div - div de la baseMap 
     */
    var addChangeBaseMapEvent = function (div) {
        $(div).change(function () {
            var newBaseMap = $(this).find('option:selected').text();
            var currentOpacity = jquerybaseMapDiv.find('#opacity').val();
            var currentActive = self.getActiveLayer(0);
            self.setBaseMap(newBaseMap);
            self.setActiveLayer(0, currentActive);
            self.setOpacity(0, currentOpacity);
        });
    };
    /**
     * At the flyover of the legend button display of the legend
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var addDisplayLegend = function (idLayer, div) {
        $(div).find('#getLegend').popover({
            html: true,
            trigger: 'hover',
            placement: 'bottom',
            content: function () {
                return '<img src="' + $(this).data('img') + '" />';
            }
        });
    };
    /**
     * Delete a layer
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var trashLayer = function (idLayer, div) {
        self.geoMap.removeLayer(idLayer);
        //Delete all
        self.jsonWriter.removeLayer(idLayer);
        $(div).toggle(function () {
            // And we will check if groups are empty to delete them too!
            $(this).remove();
            clearEmptyGroup();
        });
        if (self.dimensionSlider !== undefined) {
            self.dimensionSlider.sliderRemoveLayer(idLayer, layerCapabilities[idLayer]);
            self.dimensionSlider.updateElevSlider(idLayer);
            self.dimensionSlider.updateTimeSlider(idLayer);
        }
    };
    /**
     * Delete all groups no contains layer
     */
    var clearEmptyGroup = function () {
        jqueryLayerListDiv.find('.group-div').each(function () {
            if ($(this).find('#layers').find('.layer-conf').length <= 0) {
                $(this).remove();
                var groupId = $(this).attr('id');
                self.jsonWriter.removeGroup(groupId);
                var objKey = undefined;
                $.each(groupIds, function (index, value) {
                    if (value == groupId) {
                        objKey = index;
                    }
                });
                if (objKey) {
                    delete groupIds[objKey];
                }
            }
        });
    };
    var addZoomGroupEvent = function (idGroup, div) {
        $(div).find('#zoomOn').click(function () {
            var idLayers = getAllIdLayersGroup(idGroup);
            self.geoMap.zoomToLayers(idLayers);
        });
    };
    /**
     * Click on up group (The highest group in the list is displayed above all other layers)
     * @param {int} idGroup - Group ID
     * @param {html} div - Group div
     */
    var addUpGroupEvent = function (idGroup, div) {
        $(div).find('#upGroup').click(function () {
            var orderGroup = parseFloat(div.attr('data-ordergroup'));
            var above = div.prev('.group-div');
            if (above.hasClass('group-div')) {
                newOrderGroup = parseFloat(above.attr('data-ordergroup'));
                self.setOrderGroup(above.attr('id'), orderGroup);
                self.setOrderGroup(idGroup, newOrderGroup);
            } else {
                //au dessus nok
                return;
            }
            self.sortDivGroup();
        });
    };
    /**
     * Click group down (The lowest group in the list is displayed below all other layers)
     * @param {int} idGroup - Group ID
     * @param {html} div - Group div
     */
    var addDownGroupEvent = function (idGroup, div) {
        $(div).find('#downGroup').click(function () {
            var orderGroup = parseInt(div.attr('data-ordergroup'));
            var next = div.next('.group-div');
            if (next.hasClass('group-div')) {
                newOrderGroup = parseFloat(next.attr('data-ordergroup'));
                self.setOrderGroup(next.attr('id'), orderGroup);
                self.setOrderGroup(idGroup, newOrderGroup);
            } else {
                //au dessus nok
                return;
            }
            self.sortDivGroup();
        });
    };
    /**
     * When the user opens or replicates a group
     * @param {int} idGroup - Group ID
     * @param {html} div - Group div
     */
    var addMinimizeGroupEvent = function (idGroup, div) {
        $(div).find('#gpMinus').click(function () {
            self.setMinimizeGroup(idGroup, !$(this).hasClass('fa-plus'));
        });
    };
    /**
     * When the user clicks on the group eye
     * @param {int} idGroup - Group ID
     * @param {html} div - Group div
     */
    var addActiveGroupEvent = function (idGroup, div) {
        $(div).find('#gpEyeVisibility').click(function () {
            self.setActiveGroup(idGroup, !$(this).hasClass('fa-eye'));
            if (self.dimensionSlider !== undefined && $(this).hasClass('fa-eye')) {
                //if the SliderSize are active and the layer has been activated,
                //we check that the slider accepts this layer otherwise we will gray out the eye (it is the dimensionSlider which will call the function to make the eye go gray)
                $.each(getAllIdLayersGroup(idGroup), function (index, idLayer) {
                    self.dimensionSlider.updateLayer(idLayer);
                });
            }
        });
    };
    /**
     * When the user wants to delete a group
     * @param {html} div - Group div 
     */
    var addTrashGroupEvent = function (idGroup, div) {
        $(div).find('#trashGroup').click(function () {
            getAllLayersGroup(idGroup).each(function () {
                trashLayer($(this).attr('id'), $(this));
            });
            clearEmptyGroup();
        });
    };
    /**
     * Returns a div list of all layers in a group
     * @param {Int} groupId - Id du group
     */
    var getAllLayersGroup = function (groupId) {
        var allLayers = jqueryLayerListDiv.find('.group-div#' + groupId).find('#layers').find('.layer-conf');
        return allLayers;
    };
    /**
     * Returns a list containing all layer idLayers present in a group
     * @param {Int} groupId - Id du group
     */
    var getAllIdLayersGroup = function (groupId) {
        var idLayers = [];
        var allLayers = getAllLayersGroup(groupId);
        allLayers.each(function () {
            idLayers.push(parseInt($(this).attr('id')));
        });
        return idLayers;
    };
    /***********
     * SETTER
     */
    /**
     * Sets the opacity of a layer
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {float} opacity - Opacity to apply on the layer
     */
    this.setOpacity = function (idLayer, opacity) {
        if (opacity > 1) {
            opacity = 1;
        }
        if (opacity < 0) {
            opacity = 0;
        }
        var jqueryDiv = jqueryLayerListDiv;
        if (idLayer == 0) {
            jqueryDiv = jquerybaseMapDiv;
        }
        div = jqueryDiv.find('.layer-conf#' + idLayer).find('#opacity').slider('setValue', opacity);
        jqueryDiv.find('.layer-conf#' + idLayer).find('#opacityPercent').text(parseInt(opacity * 100) + ' %');
        self.geoMap.changeOpacity(idLayer, opacity);
        self.jsonWriter.setOpacity(idLayer, opacity);
        if (idLayer > 0) {
            self.jsonWriter.setOpacity(idLayer, opacity);
        } else {
            self.jsonWriter.setBaseMapOpacity(opacity);
        }
    };
    /**
     * Sets the visibility of a layer
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {bool} visibility - if true displays the layer (and the eye), the cache and bars the eye if not
     */
    this.setActiveLayer = function (idLayer, visibility) {
        var jqueryDiv = jqueryLayerListDiv;
        if (idLayer == 0) {
            jqueryDiv = jquerybaseMapDiv;
        }
        if (visibility) {
            jqueryDiv.find('.layer-conf#' + idLayer).find('#eyeVisibility').removeClass('fa-eye-slash').addClass('fa-eye');
            jqueryDiv.find('.layer-conf#' + idLayer).find('#eyeVisibility').attr('title', trans['hideLayer']);
            jqueryDiv.find('.layer-conf#' + idLayer).find('#eyeVisibility').attr('data-original-title', trans['hideLayer']);
            if (idLayer == 0) {
                //If it was the baseMap
                jqueryDiv.find('.layer-conf#' + idLayer).find('#eyeVisibility').attr('title', trans['layerManagerHideMapBackground']);
                jqueryDiv.find('.layer-conf#' + idLayer).find('#eyeVisibility').attr('data-original-title', trans['layerManagerHideMapBackground']);
            }
            jqueryDiv.find('.layer-conf#' + idLayer).removeClass('inactiveLayer');
        } else {
            jqueryDiv.find('.layer-conf#' + idLayer).find('#eyeVisibility').removeClass('fa-eye').addClass('fa-eye-slash');
            jqueryDiv.find('.layer-conf#' + idLayer).find('#eyeVisibility').attr('title', trans['showLayer']);
            jqueryDiv.find('.layer-conf#' + idLayer).find('#eyeVisibility').attr('data-original-title', trans['showLayer']);
            if (idLayer == 0) {
                //If it was the baseMap
                jqueryDiv.find('.layer-conf#' + idLayer).find('#eyeVisibility').attr('title', trans['layerManagerShowMapBackground']);
                jqueryDiv.find('.layer-conf#' + idLayer).find('#eyeVisibility').attr('data-original-title', trans['layerManagerShowMapBackground']);
            }
            jqueryDiv.find('.layer-conf#' + idLayer).addClass('inactiveLayer');
        }
        self.geoMap.setLayerVisibility(idLayer, visibility);
        if (idLayer > 0) {
            self.jsonWriter.setActive(idLayer, visibility);
        } else {
            self.jsonWriter.setBaseMapActive(visibility);
        }
    };
    this.setActiveGroup = function (idGroup, visibility) {
        if (visibility) {
            jqueryLayerListDiv.find('.group-div#' + idGroup).find('.group').find('#gpEyeVisibility').removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            jqueryLayerListDiv.find('.group-div#' + idGroup).find('.group').find('#gpEyeVisibility').removeClass('fa-eye').addClass('fa-eye-slash');
        }
        $.each(getAllIdLayersGroup(idGroup), function (index, idLayer) {
            if (visibility) {
                if (self.getActiveLayer(idLayer)) {
                    self.geoMap.setLayerVisibility(idLayer, visibility);
                    jqueryLayerListDiv.find('.layer-conf#' + idLayer).removeClass('inactiveLayer');
                }
            } else {
                self.geoMap.setLayerVisibility(idLayer, visibility);
                jqueryLayerListDiv.find('.layer-conf#' + idLayer).addClass('inactiveLayer');
            }
        });
        self.jsonWriter.setActiveGroup(idGroup, visibility);
    };
    /**
     * Sets the index of a layer (the higher the index, the more the layer is displayed below the others)
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {int} order - layer index
     */
    this.setOrderLayer = function (idLayer, order) {
        jqueryLayerListDiv.find('.layer-conf#' + idLayer).attr('data-orderLayer', order);
        self.jsonWriter.setLayerOrderInGroup(idLayer, order);
        self.geoMap.changeLayerIndex(idLayer, order);
    };
    this.getOrderLayer = function (idLayer) {
        return jqueryLayerListDiv.find('.layer-conf#' + idLayer).attr('data-orderLayer');
    };
    /**
     * Sets the group order (the larger the group, the smaller the group is displayed below the others)
     * The group order displays and changes the order of the layers of the group to ensure consistency
     * @param {int} idGroup - Group ID
     * @param {int} order - order du group 
     */
    this.setOrderGroup = function (idGroup, order) {
        $.each(getAllIdLayersGroup(idGroup), function (index, idLayer) {
            var actualLayerOrder = parseFloat(jqueryLayerListDiv.find('.layer-conf#' + idLayer).attr('data-orderLayer'));
            var newLayerOrder = actualLayerOrder + parseInt(parseInt(order) - parseInt(actualLayerOrder));
            // Grand calcul scientifique
            self.setOrderLayer(idLayer, newLayerOrder);
        });
        jqueryLayerListDiv.find('.group-div#' + idGroup).attr('data-ordergroup', order);
        self.jsonWriter.setGroupOrder(idGroup, order);
    };
    /**
     * Define the background
     * @param {String} newBaseMap  - The name of the new baseMap
     */
    this.setBaseMap = function (newBaseMap) {
        self.geoMap.changeBaseMap(newBaseMap);
        var value = newBaseMap.split(' ').join('_');
        jquerybaseMapDiv.find('select').val(value);
        self.jsonWriter.setBaseMapName(newBaseMap);
    };
    this.getActiveGroup = function (idGroup) {
        return jqueryLayerListDiv.find('.group-div#' + idGroup).find('.group').find('#gpEyeVisibility').hasClass('fa-eye');
    };
    this.getActiveGroupByIdLayer = function (idLayer) {
        var idGroup = jqueryLayerListDiv.find('.layer-conf#' + idLayer).closest('.group-div').attr('id');
        return self.getActiveGroup(idGroup);
    };
    /**
     * Returns true if the layer is active
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     */
    this.getActiveLayer = function (idLayer) {
        var jqueryDiv = jqueryLayerListDiv;
        if (idLayer == 0) {
            jqueryDiv = jquerybaseMapDiv;
        }
        return jqueryDiv.find('.layer-conf#' + idLayer).find('#eyeVisibility').hasClass('fa-eye');
    };
    /**
     * Lets you know the state of the eye of visibility for a layer. Returns true if the eye is active
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     */
    this.getEyeVisibility = function (idLayer) {
        var jqueryDiv = jqueryLayerListDiv;
        if (idLayer == 0) {
            jqueryDiv = jquerybaseMapDiv;
        }
        return jqueryDiv.find('.layer-conf#' + idLayer).find('#eyeVisibility').hasClass('fa fa-eye');
    };
    /**
     * Lets you sort layerManager div / layers according to the order / index of the layers (the strongest index is at the top).
     */
    this.sortDivLayer = function () {
        jqueryLayerListDiv.find('.group-div').each(function () {
            var groupDiv = $(this).find('#layers');
            groupDiv.children('div').sort(function (a, b) {
                return $(a).attr('data-orderLayer') - $(b).attr('data-orderLayer');
            }).each(function () {
                groupDiv.prepend(this);
            });
        });
    };
    /**
     * Lets you sort the div / group of the layerManager according to the order / index of the groups (the strongest index is at the top).
     */
    this.sortDivGroup = function () {
        jqueryLayerListDiv.children('.group-div').sort(function (a, b) {
            return $(a).attr('data-ordergroup') - $(b).attr('data-ordergroup');
        }).each(function () {
            jqueryLayerListDiv.prepend(this);
        });
    };
    /**
     * Change the open / collapsed state of a group
     * @param {int} idGroup - Group ID
     * @param {bool} minimize - true to minimize the group
     */
    this.setMinimizeGroup = function (idGroup, minimize) {
        if (minimize) {
            jqueryLayerListDiv.find('.group-div#' + idGroup).find('.group').find('#gpMinus').removeClass('fa-minus').addClass('fa-plus');
            //TODO : change title and data-roginal-title
            jqueryLayerListDiv.find('.group-div#' + idGroup).find('#layers').hide('slow');
        } else {
            jqueryLayerListDiv.find('.group-div#' + idGroup).find('.group').find('#gpMinus').removeClass('fa-plus').addClass('fa-minus');
            //TODO : change title and data-roginal-title
            jqueryLayerListDiv.find('.group-div#' + idGroup).find('#layers').show('slow');
        }
        self.jsonWriter.setMinmizeGroupe(idGroup, minimize);
    };
    /***********
     * LODERJSON
     */
    this.checkMapCookies = function () {
        var jsonMap = self.jsonWriter.readMapCookie();
        if (jsonMap != '') {
            self.loadJsonMap(jsonMap);
        }
    };
    /**
     * Load a Json card
     * @param {JSONString} jsonMap - String Json corresponding to the card to be loaded
     */
    this.loadJsonMap = function (jsonMap) {
        jsonObj = JSON.parse(jsonMap);
        self.removeAllLayer();
        self.dimensionSlider.resetDimensionSlider();
        if (jsonObj == undefined || jsonObj == '') {
            console.log('Erreur de chargement de la jsonMap');
            return;
        }
        if (jsonObj.mapName !== undefined && jsonObj.mapName != '') {
            layerManagerConfig.mapName = jsonObj.mapName;
        }
        if (jsonObj.layers != '' || jsonObj.layers !== undefined) {
            $.each(jsonObj.layers, function (index, layerItem) {
                //You have to find the displayName of the group
                var groupDisplayName = undefined;
                if (jsonObj.layerGroups != '' || jsonObj.layerGroups !== undefined) {
                    $.each(jsonObj.layerGroups, function (index, groupItem) {
                        if (groupItem.groupName == layerItem.layerGroupName) {
                            groupDisplayName = groupItem.groupDisplayName;
                        }
                    });
                }
                var idLayer = self.addLayer(layerItem.layerName, layerItem.layerDisplayName, groupDisplayName);
                if (idLayer == null) {
                    return true;    //continue
                }
                self.setActiveLayer(idLayer, layerItem.active);
                self.setOpacity(idLayer, layerItem.opacity);
                self.setOrderLayer(idLayer, layerItem.layerOrderInGroup);
            });
            self.sortDivLayer();
        }
        if (jsonObj.layerGroups != '' || jsonObj.layerGroups !== undefined) {
            $.each(jsonObj.layerGroups, function (index, groupItem) {
                var groupDiv = getOrCreateGroupDiv(groupItem.groupDisplayName);
                var currentGroupId = groupDiv.attr('id');
                self.setActiveGroup(currentGroupId, groupItem.groupActive);
                self.setMinimizeGroup(currentGroupId, groupItem.minimize);
            });
        }
        if (jsonObj.baseMap != '' || jsonObj.baseMap !== undefined) {
            var newBaseMapName = jsonObj.baseMap.baseMapName;
            var newBaseMapOpacity = jsonObj.baseMap.opacity;
            var newBaseMapActive = jsonObj.baseMap.active;
            self.setBaseMap(newBaseMapName);
            self.setActiveLayer(0, newBaseMapActive);
            self.setOpacity(0, newBaseMapOpacity);
        }
        if (jsonObj.extent && jsonObj.extentEPSG) {
            self.geoMap.setMapCenter(jsonObj.extent, jsonObj.extentEPSG);
        }
        if (jsonObj.zoom) {
            self.geoMap.setZoom(jsonObj.zoom);
        }
    };
    /**
     * Lets you update the size of the div containing the list of layers
     * @param {float} size - Size of the div map
     */
    this.updateDivLayerListSize = function (size) {
        var maxHeightLayerList = size;
        jqueryLayerListDiv.css('max-height', maxHeightLayerList);
    }    /**
 * END OF layerManager Object
 */;
};
var library = function (modalDiv, geoserverURL, workspaceLimit) {
    var self = this;
    this.modalDiv = modalDiv;
    var jqueryModalDiv = $('#' + modalDiv);
    this.workspaceLimit = workspaceLimit;
    var geoserverURL = geoserverURL;
    var layerCapabilities = {};
    /**
     * Permet de créer la modal contenant tous les layers disponibles
     */
    this.createModalListLayer = function () {
        //we create the modal
        var modalDiv = addModal();
        jqueryModalDiv.append(modalDiv);
        //When we edit the name of the group and the user clicks on "Enter", we validate
        jqueryModalDiv.find('#groupName').on('keypress', function (e) {
            if (e.keyCode === 13) {
                jqueryModalDiv.find('#add_layers').trigger('click');
            }
        });
        //For all layers, we will recover their capabilities, create the list of available layers for the library and store them
        var parser = new ol.format.WMSCapabilities();
        $.each(self.workspaceLimit, function (index, workspaceNameAndDisplay) {
            var workspaceSplit = workspaceNameAndDisplay.split(':');
            var workspaceName = workspaceSplit[0];
            var workspaceNameDisplay = workspaceName;
            if (workspaceSplit.length > 1) {
                workspaceSplit.shift();
                //I delete the first elemnet (the name of the workspace) and I join with the seprator (if ever the name to display contains ':')
                workspaceNameDisplay = workspaceSplit.join(':');
            }
            var urlGetCap = geoserverURL + 'geoserver/' + workspaceName + '/wms?service=wms&version=1.3.0&request=GetCapabilities';
            $.ajax(urlGetCap).done(function (res) {
                getCapabilitiesLib = parser.read(res);
                if (getCapabilitiesLib.Capability.Layer.Layer == undefined) {
                    console.log('Error with cap-worksapce : ' + workspaceName);
                    return;
                }
                var wsDiv = modalCreateWorkspace(workspaceName, workspaceNameDisplay, getCapabilitiesLib.Capability.Layer.Layer.length);
                jqueryModalDiv.find('.modal-body').append(wsDiv);
                workspaceChangeCollapsed(workspaceName);
                allLayer = getCapabilitiesLib.Capability.Layer.Layer;
                $.each(allLayer, function (index, item) {
                    var layerName = item.Name;
                    var layerTitle = item.Title;
                    var newLay = modalCreateLayer(workspaceName, layerName, layerTitle);
                    layerCapabilities[workspaceName + ':' + layerName] = item;
                    jqueryModalDiv.find('.modal-body').find('#' + workspaceName).find('.list-layers').append(newLay);
                });
                addSelectWorkspaceEvent(jqueryModalDiv.find('.modal-body').find('#' + workspaceName));
                self.sortDivWorkspace();
            }).fail(function () {
                console.log('Faild to load workspace : \t' + workspaceName);
            });
        });
    };
    /**
     * Returns the capabilities of a layer
     * @param {String} layerName - Layer name (ws: layername)
     */
    this.getLayerCapabilities = function (layerName) {
        return layerCapabilities[layerName];
    };
    /**
     * Open the modal manually (function used by the layerManager)
     */
    this.openLibrary = function () {
        jqueryModalDiv.find('#modalAddLayer').modal('show');
    };
    /**
     * Allows to manage the addition of the layers (called when the valid user is choice of layer)
     * @param {function} callback - function that will be called with an object key parameter: layername value: capabilities of the layer (the LayerManager sends its function to change the layers on its side)
     */
    this.addLayers = function (callback) {
        jqueryModalDiv.find('#add_layers').click(function () {
            //var listLayers = {};
            var listLayers = [];
            var cpt = 0;
            jqueryModalDiv.find('#modalAddLayer #layer input[type=\'checkbox\']').each(function () {
                if ($(this).is(':checked')) {
                    cpt = cpt + 1;
                    layer = $(this).closest('#layer').data('layer');
                    workspace = $(this).closest('#layer').data('workspace');
                    //listLayers[workspace +":" + layer] = layerCapabilities[workspace +":" + layer];
                    listLayers.push(workspace + ':' + layer);
                }
            });
            var groupName = jqueryModalDiv.find('#modalAddLayer .modal-footer .group-name #groupName').val();
            callback(listLayers, groupName);
            jqueryModalDiv.find('#modalAddLayer').modal('hide');
            jqueryModalDiv.find('#modalAddLayer input[type=\'checkbox\']').each(function () {
                if ($(this).is(':checked')) {
                    $(this).prop('checked', false);
                }
            });
            jqueryModalDiv.find('#modalAddLayer .panel-collapse').each(function () {
                $(this).collapse('hide');
            });
        });
    };
    /**
     * The general code of the modal of the library
     */
    var addModal = function () {
        var div = '<div class="modal fade" id="modalAddLayer" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">         <div class="modal-dialog">             <div class="modal-content">                 <div class="modal-header">                     <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">\xD7</span><span class="sr-only">Close</span></button>                     <h4 class="modal-title" id="myModalLabel">' + trans['layerLibrary'] + '</h4>                 </div>                 <div class="modal-body">                 </div>                 <div class="modal-footer">                     <div class="input-group group-name">                         <span class="input-group-addon">' + trans['newGroupName'] + '</span>                         <input id="groupName" type="text" class="form-control" name="msg" placeholder="' + trans['standardGroupName'] + '">                     </div>                     <button type="button" class="btn btn-default cancel" data-dismiss="modal">' + trans['cancel'] + '</button>                     <button type="button" class="btn btn-primary" id="add_layers">' + trans['loadLayers'] + '</button>                 </div>             </div>         </div>     </div>';
        return div;
    };
    /**
     * Code to create a panel-group for each workspace
     * @param {String} workspaceName - Technical name of workspace
     * @param {String} workspaceNameDisplay - Name of the worksapce to display (configured in the conf file)
     * @param {int} nbLayers - Number of layer available within this workspace
     */
    var modalCreateWorkspace = function (workspaceName, workspaceNameDisplay, nbLayers) {
        var ws = '<div class="panel-group" id="' + workspaceName + '" data-display-name="' + workspaceNameDisplay + '">       <div class="panel panel-primary">         <div class="panel-heading bgColor2Darker">           <h4 class="panel-title">             <input type="checkbox" id="selectWorkspaceLayers">             <span data-toggle="collapse" class="workspace-link" href="#collapse_' + self.modalDiv + workspaceName + '">                 <b>' + workspaceNameDisplay + '</b>                 <span class="left-separator borderColor2"></span>                 <span class="label label-default bgColor2">' + nbLayers + '</span>                <i class="fa fa-map-o layer-icon" aria-hidden="true"></i>                 <i class="fa fa-plus open-workspace"></i>            </span>           </h4>         </div>         <div id="collapse_' + self.modalDiv + workspaceName + '" class="panel-collapse collapse">           <ul class="list-group list-layers">           </ul>           <div class="panel-footer"></div>         </div>       </div>     </div>';
        return ws;
    };
    var workspaceChangeCollapsed = function (idPanel) {
        jqueryModalDiv.find('#collapse_' + self.modalDiv + idPanel).on('shown.bs.collapse', function () {
            jqueryModalDiv.find('.panel-group#' + idPanel + ' .workspace-link .open-workspace').removeClass('fa-plus').addClass('fa-minus');
        });
        jqueryModalDiv.find('#collapse_' + self.modalDiv + idPanel).on('hidden.bs.collapse', function () {
            jqueryModalDiv.find('.panel-group#' + idPanel + ' .workspace-link .open-workspace').removeClass('fa-minus').addClass('fa-plus');
        });
    };
    /**
     * Lets you create a layer for integration into the panel-group of the workspace
     * @param {String} workspaceName - Nom du workspace
     * @param {String} layerName - Name of the layer
     * @param {String} layerTitle - Title of the layer
     */
    var modalCreateLayer = function (workspaceName, layerName, layerTitle) {
        if (layerTitle == '' || layerTitle == undefined) {
            layerTitle = layerName;
        }
        var lay = '<li class="list-group-item" id="layer" data-layer="' + layerName + '" data-workspace="' + workspaceName + '">         <label for="' + layerName + '">              <input type="checkbox" id="' + layerName + '">             <div class="layer-description">                 <i class="fa fa-map-o layer-icon" aria-hidden="true"></i>                 <strong>' + layerTitle + '</strong><br/>' + layerName + '            </div>        </label>        </li>';
        return lay;
    };
    /**
     * When the user clicks on the input of a workspace, one activates / deactivates all the layers of this workspace
     * @param {jqueryDiv} wsDiv -Jquery object from workspace
     */
    var addSelectWorkspaceEvent = function (wsDiv) {
        wsDiv.find('#selectWorkspaceLayers').click(function () {
            var ws_checked = $(this).prop('checked');
            $(this).parent().parent().parent().find('.list-layers').find('input').each(function () {
                $(this).prop('checked', ws_checked);
            });
        });
    };
    /**
     * Sort the workspace div in the library in alphabetical order
     */
    this.sortDivWorkspace = function () {
        jqueryModalDiv.find('.panel-group').sort(function (a, b) {
            return $(a).attr('data-display-name') < $(b).attr('data-display-name');
        }).each(function () {
            jqueryModalDiv.find('.modal-body').prepend(this);
        });
    };
};
var mapLayer = function (config) {
    var defaults = {
            lang: 'en',
            map: {
                divMap: 'map',
                geoMapConfig: {
                    defaultBaseMap: 'OSM',
                    defaultXCenter: 2,
                    defaultYCenter: 48,
                    defaultZoomLevel: 5
                },
                geoserverName: '<yourGeoServerURL>',
                workspaceLimit: ['<workspaceName[:workspaceDisplayName]>', '<workspaceName[:workspaceDisplayName]>'],
                keyBING: '<yourBingKey>'
            },
            layerManager: {
                height: '',
                divLayerManagerModal: 'layerManagerModal',
                divLayerManager: 'layerManager',
                divSaveMapModal: 'LMSaveMapModal',
                config: {
                    defaultOpacity: 1,
                    defaultLayerActive: true
                }
            },
            dynSlider: {
                divMapLevelAxe: 'slider_elev',
                divMapTimeAxe: 'slider_time'
            }
        };
    function overrideExistedKey(obj) {
        $.each(obj, function (key1, value1) {
            if (typeof defaults[key1] == 'object') {
                $.each(obj[key1], function (key2, value2) {
                    if (typeof defaults[key1][key2] == 'object') {
                        $.each(obj[key1][key2], function (key3, value3) {
                            defaults[key1][key2][key3] = value3;
                        });
                    } else {
                        defaults[key1][key2] = value2;
                    }
                });
            } else {
                defaults[key1] = value1;
            }
        });
    }
    if (typeof config == 'object') {
        overrideExistedKey(config);
    }
    config = defaults;
    var self = this;
    var layerManagerConfig = config.layerManager.config;
    self.map = new geoMap(config.map.divMap, config.map.geoserverName, config.map.keyBING);
    self.myJsonWriter = new jsonWriter();
    self.myDimensionSlider = new dimensionSlider(config.dynSlider.divMapLevelAxe, config.dynSlider.divMapTimeAxe);
    self.myLibrary = new library(config.layerManager.divLayerManagerModal, config.map.geoserverName, config.map.workspaceLimit);
    self.layerManager = new layerManager(config.layerManager.divLayerManager, self.map, self.myJsonWriter, self.myDimensionSlider, self.myLibrary, config.layerManager.config);
    self.saveLoadMap = new saveLoadMap(config.layerManager.divSaveMapModal, [], '#', '');
    self.map.initMap(config.map.geoMapConfig);
    self.layerManager.init();
    self.myLibrary.createModalListLayer();
    self.layerManager.createBaseMap();
    self.saveLoadMap.init();
    self.layerManager.addCrud(self.myLibrary.openLibrary, self.saveLoadMap.openSaveMapModal, self.saveLoadMap.openLoadMapModal);
    self.myLibrary.addLayers(self.layerManager.loadLibraryLayers);
    $('[data-toggle="tooltip"]').tooltip();
    $(window).resize(function () {
        if (config.layerManager.height === '') {
            self.layerManager.updateDivLayerListSize($(window).height() - $('#contenairConfig').height() - $('.layer-manager-title').outerHeight() - $('.map-title-first').outerHeight());
        } else {
            self.layerManager.updateDivLayerListSize(config.layerManager.height);
        }
        self.map.updateDivMapSize;
    }).resize();
};
var saveLoadMap = function (modalDiv, mapArray, route, token) {
    var self = this;
    var route = route;
    var modalDiv = modalDiv;
    var mapArray = mapArray;
    var token = token;
    var jquerySaveDiv = $('#' + modalDiv).append('<div id=\'saveModal\'></div>').find('#saveModal');
    var jqueryLoadDiv = $('#' + modalDiv).append('<div id=\'loadModal\'></div>').find('#loadModal');
    var LayerMangerLoadFunction;
    /**
     * Initialize the modal
     */
    this.init = function () {
        jquerySaveDiv.append(addSaveModal());
        jqueryLoadDiv.append(addLoadModal());
        $.each(mapArray, function (index, item) {
            jqueryLoadDiv.find('#listMap').append('<option value="' + item.id + '">' + item.mapname + '</option>');
        });
        jquerySaveDiv.find('#modalSaveMap').find('#btn-save-map').click(function () {
            var mapName = jquerySaveDiv.find('#modalSaveMap').find('#nameMapSave').val();
            var jsonMap = jquerySaveDiv.find('#modalSaveMap').find('#jsonMapSave').val();
            download(mapName + '.json', jsonMap);
            jquerySaveDiv.find('#modalSaveMap').modal('hide');
            jquerySaveDiv.find('#formJsonMapSave')[0].reset();
        });
        jqueryLoadDiv.find('#modalLoadMap').find('#btn-load-map').click(function () {
            loadFile(LayerMangerLoadFunction);
            jqueryLoadDiv.find('#loadJsonFile')[0].reset();
        });
    };
    /**
     * Saving a card
     */
    this.openSaveMapModal = function (jsonMap) {
        jquerySaveDiv.find('#modalSaveMap').modal('show');
        jquerySaveDiv.find('#modalSaveMap').find('#jsonMapSave').val(jsonMap);
    };
    var download = function (filename, text) {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);
        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        } else {
            pom.click();
        }
    };
    /**
     * Loading a map
     */
    this.openLoadMapModal = function (loadMap) {
        LayerMangerLoadFunction = loadMap;
        jqueryLoadDiv.find('#modalLoadMap').modal('show');
    };
    var loadFile = function (loadMap) {
        var input, file, fr;
        if (typeof window.FileReader !== 'function') {
            alert(trans['apiNotSupported']);
            return;
        }
        input = document.getElementById('files');
        if (!input) {
        } else if (!input.files) {
            alert(trans['browserNotSupported']);
        } else if (!input.files[0]) {
            alert(trans['errorSelectFile']);
        } else {
            file = input.files[0];
            fr = new FileReader();
            fr.onload = receivedText;
            fr.readAsText(file);
        }
        function receivedText(e) {
            lines = e.target.result;
            loadMap(lines);
        }
    };
    /**
     * The general code of the modal Save
     */
    var addSaveModal = function () {
        var div = '<div class="modal fade" id="modalSaveMap" role="dialog" aria-labelledby="myModalSaveLabel" aria-hidden="true">         <div class="modal-dialog">             <div class="modal-content">                 <form id="formJsonMapSave" role="form" method="POST" action="' + route + '">                     <div class="modal-header">                         <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">\xD7</span><span class="sr-only">' + trans['close'] + '</span></button>                         <h4 class="modal-title" id="myModalSaveLabel">' + trans['saveMap'] + '</h4>                     </div>                     <div class="modal-body">                         <input type="text" name="nameMapSave" id="nameMapSave" class="form-control" maxlength="200" />                          <input type="hidden" name="jsonMapSave" id="jsonMapSave" class="form-control" />                         <input type="hidden" name="statusSave" id="statusSave" class="form-control" value="public"/>                          <input type="hidden" name="idCurrentSave" id="idCurrentSave" class="form-control" value="1"/>                          <input type="hidden" name="_token" value="' + token + '">                    </div>                     <div class="modal-footer">                         <button type="button" class="btn btn-default pull-left" data-dismiss="modal">' + trans['cancel'] + '</button>                         <button type="button" id="btn-save-map" class="btn btn-primary pull-right">' + trans['save'] + '</button>                     </div>                 </form>             </div>         </div>     </div>';
        return div;
    };
    /**
     * The general code of the modal Load
     */
    var addLoadModal = function () {
        var div = '<div class="modal fade" id="modalLoadMap" role="dialog" aria-labelledby="myModalLoadLabel" aria-hidden="true">         <div class="modal-dialog">             <div class="modal-content"> \t\t\t\t<form id="loadJsonFile" name="jsonFile" enctype="multipart/form-data" method="post"> \t\t\t\t\t<div class="modal-header"> \t\t\t\t\t\t<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">\xD7</span><span class="sr-only">' + trans['close'] + '</span></button> \t\t\t\t\t\t<h4 class="modal-title" id="myModalLoadLabel">' + trans['loadMap'] + '</h4> \t\t\t\t\t</div> \t\t\t\t\t<div class="modal-body"> \t\t\t\t\t\t\t<input type="file" id="files" name="file" /> \t\t\t\t\t</div> \t\t\t\t\t<div class="modal-footer"> \t\t\t\t\t\t<button type="button" class="btn btn-default pull-left" data-dismiss="modal">' + trans['cancel'] + '</button> \t\t\t\t\t\t<button type="button" id="btn-load-map" data-dismiss="modal" class="btn btn-primary pull-right">' + trans['load'] + '</button> \t\t\t\t\t</div> \t\t\t\t</form>             </div>         </div>     </div>';
        return div;
    }    /**
     * END OF saveMap Object
     */;
};
/**
 * ###
 * # Fonction l'upload
 */
var majNameInputFile = function (div, span, submit) {
    var input = $('#' + div);
    if (input.val().length <= 0) {
        return;
    }
    var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    $('#' + span).text(' - ' + label);
    $('#' + submit).show();
};
/**
 * Fonction permettant de mettre à jour une progress bar
* @param {Object} progress_bar - L'objet Jquery correspondant à la progress bar 
* @param {int} max - le total à uploader (e.total)
* @param {int} current - le total actuellement chargé (e.loaded)
*/
function progress(submitId, max, current) {
    var Percentage = Math.floor(current * 100 / max);
    $('#' + submitId + ' span').html(trans['Uploadinprogress'] + ' : ' + Percentage + '%');
    if (Percentage >= 100)
        // process completed  
        {
            //On ne va pas désactiver tout de suite le 'active' de la progress bar parce qu'il se passe des actions côté server qui prennent du temps.    
            $('#' + submitId + ' span').text(trans['ServerTreatment']);
        }
}
var uploadFile = function (div) {
    $('form#' + div).submit(function (event) {
        //event.preventDefault();//On stop la propagation de l'evenement
        var url = $(this).attr('action');
        if ($('#inputfile').get(0).files.length == 0) {
            //Si aucun fichier n'est selectionné, on quitte
            return;
        }
        var formData = new FormData(this);
        $(this).find(':input').each(function () {
            $(this).prop('disabled', true);
        });
        var resAjax = $.ajax({
                url: url,
                cache: false,
                contentType: false,
                processData: false,
                data: formData,
                type: 'post',
                headers: { 'X-XSRF-TOKEN': $('form#upload_file_form input[name="_token"]').val() },
                xhr: function () {
                    //Pour afficher la progression
                    var myXhr = $.ajaxSettings.xhr();
                    if (myXhr.upload) {
                        myXhr.upload.addEventListener('progress', function (e) {
                            progress('sbmitUpload', e.total, e.loaded);
                        }, false);
                    }
                    return myXhr;
                },
                success: function () {
                    $('#sbmitUpload' + ' span').text(trans['successTreatment']);
                    $('#loader-finsh-spinner').show();    /*console.log("Upload complete");
                var filename = $("#inputfile").val().replace(/\\/g, '/').replace(/.*\//, '');
                $.when(updateMartheFileList()).done(function(){//On va coloriser le nom du fichier qui vient d'être ajouté
                    $('div[id="div_' + filename + '"]').css("background-color", "#D1AD0D");
                    $('div[id="div_' + filename + '"]').animate({
                        backgroundColor: 'transparent',
                    },1500);
                });*/
                },
                fail: function () {
                    $('#loader-error-spinner').show();
                    console.log('Upload error');
                }
            });
        resAjax.always(function () {
            console.log('FIN');
            $('#sbmitUpload span').text(trans['Uploadnewfile']);
            $('form#upload_file_form :input').each(function () {
                $(this).prop('disabled', false);
            });
        });
    });
};