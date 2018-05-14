


var layerManager = function(div, geoMap, jsonWriter, dimensionSlider, library, layerManagerConfig){
    var self = this;
    this.lmDiv = div;
    var jqueryLMDiv = $("#"+this.lmDiv);
    var jqueryCLDiv = $("#"+this.lmDiv).append("<div id='contenairList' class=''></div>").find("#contenairList");
    var jqueryCCDiv = $("#"+this.lmDiv).append("<div id='contenairConfig' class='bgColor2'></div>").find("#contenairConfig");
    var jqueryLayerListDiv = jqueryCLDiv.append("<div id='layerList' class='layer-list'></div>").find("#layerList");
    var jquerybaseMapDiv = jqueryCCDiv.append("<div id='baseMap' ></div>").find("#baseMap");
    var jqueryCRUDDiv = jqueryCCDiv.append("<div id='CRUD' ></div>").find("#CRUD");
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

    this.getGroup = function(){
        return groupIds;
    }


    /**
     * Launch Initialization functions
     */
    this.init = function(){
        self.geoMap.addCallbackOnMoveMap(actionOnMoveMap);
        if(dimensionSlider !== undefined){
            dimensionSlider.setCallbackUpdateParam(self.geoMap.updateParam);
            dimensionSlider.setCallbackChangeVisiblity(self.setActiveLayer);
           // dimensionSlider.setCallbackChangeVisiblity(self.setEyeVisibility);
        }      
    }

    /**
     * Remove all layers present in the layerManager
     */
    this.removeAllLayer = function(){
        var idLayer = []
        jqueryLayerListDiv.find(".layer-conf").each(function(){
            trashLayer($(this).attr("id"), $(this))
        });
        groupOrder = startGroupOrder;
        self.jsonWriter.forceRemoveAllGroup();
        self.jsonWriter.forceRemoveAllLayer();
    }



    this.removeLayerManager = function(){
        self.removeAllLayer();
        jqueryLMDiv.html("")
        jqueryLMDiv = $("#"+this.lmDiv);
        jqueryLayerListDiv = $("#"+this.lmDiv).append("<div id='layerList' class='layer-list'></div>").find("#layerList");
        jquerybaseMapDiv = $("#"+this.lmDiv).append("<div id='baseMap' ></div>").find("#baseMap");
        jqueryCRUDDiv = $("#"+this.lmDiv).append("<div id='CRUD' ></div>").find("#CRUD");
    }

    /**
     * Geomap callback function to perform an action each time the user moves the map
     * @param {int} zoom - Current zoom of the map
     * @param {Array} extent - Float Array representing the extent of the map
     * @param {String} epsg - EPSG of the map
     */
    var actionOnMoveMap = function(zoom, extent, epsg){
        self.jsonWriter.setZoom(zoom);
        self.jsonWriter.setExtent( extent, epsg);
    }
    

    /**
     * Create and add the 3 buttons (backup / openMap / LoadLayers)
     * @param {function} onAddLayer - Callback which will be called when the user clicks on "loadLayers". This callback is managed by the object Library
     */
    this.addCrud = function(onAddLayer, onSaveMap, onLoadMap,div){
        divCRUD = '<div class="CRUD-layer-manager"> \
            <span class="fa-stack fa-lg fa-2x bgColor1" id="saveMap" data-toggle="tooltip" title="'+ trans["layerManagerSaveMap"] +'"> \
                <i class="fa fa-floppy-o fa-stack-1x animated bgColor1 color2Hover"></i> \
            </span> \
            <span class="fa-stack fa-lg fa-2x bgColor1" id="openMap" data-toggle="tooltip" title="'+ trans["layerManagerOpenMap"] +'"> \
                <i class="fa fa-folder-open-o fa-stack-1x animated  bgColor1 color2Hover"></i> \
            </span> \
            <span class="fa-stack fa-lg fa-2x bgColor1" id="addMap" data-toggle="tooltip" title="'+ trans["layerManagerAddLayer"] +'"> \
                <i class="fa fa-plus fa-stack-1x animated  bgColor1 color2Hover"></i> \
            </span> \
            <span class="fa-stack fa-lg fa-2x bgColor1" id="removeAllLayers" data-toggle="tooltip" title="'+ trans["layerManagerRemoveAllLayer"] +'"> \
                <i class="fa fa-trash fa-stack-1x animated bgColor1 color2Hover"></i> \
            </span> \
        </div>';
        
        if(div!==undefined){
            newDiv = $(div).append(divCRUD);
        }else{
            newDiv = jqueryCRUDDiv.append(divCRUD);
        }  
        newDiv.find("#saveMap").click(function(){
            onSaveMap(self.jsonWriter.getJsonString());
        });
        newDiv.find("#openMap").click(function(){
            onLoadMap(self.loadJsonMap);
        });
        newDiv.find("#addMap").click(function(){
            onAddLayer();
        })
        newDiv.find("#removeAllLayers").click(function(){
            var confirmRemove = confirm(trans['layerManagerConfirmRemoveAll']);
            if(confirmRemove){
                self.removeAllLayer();
            }
        })
        jqueryCRUDDiv = newDiv;
    }



    /**
     * Add a layer in the layerManager and to the map
     * @param {String} layerName - Layer name in the getCap (workspace:layername)
     * @param {String} layerDisplayName - Display name of the layer layerManager
     * @param {int} forceGroupOrder - Force group order
     */
    this.addLayer = function(layerName, layerDisplayName, layerGroupDisplayName, forceGroupOrder, server){
		console.log(layerName + " - " + layerDisplayName + " - " + layerGroupDisplayName + " - " + forceGroupOrder + " - " + server);
        layerCap = self.library.getLayerCapabilities(layerName)
        
        if(layerDisplayName == "" || layerDisplayName === undefined){
            layerDisplayName = ((layerCap === undefined || layerCap.Title === undefined || layerCap.Title == "") ? layerName : layerCap.Title)
        }
        if(layerGroupDisplayName == "" || layerGroupDisplayName === undefined){
            //If the groupName has already been added, the groupDisplayName will not be taken into account!
            layerGroupDisplayName = trans["standardGroupName"];
        }
        
        
        groupDiv = getOrCreateGroupDiv(layerGroupDisplayName, forceGroupOrder);
        var currentGroupId = groupDiv.attr('id');
        actualOrderGroup = groupDiv.data("ordergroup");
        var orderSubGroup = (groupDiv.find(".layer-conf").length + 1) / demultiplicateurOrderLayer; //TODO : s'il y a plus de 1000 layer dans un group on va avoir un problème
        thisOrder = actualOrderGroup + orderSubGroup;


        //Check if the max number of layers in a group (demultiplicateurOrderLayer) is reached 
        var MaxOrderInGroup = 0;
        $.each(getAllIdLayersGroup(currentGroupId), function(index, idLayer){
            self.dimensionSlider.updateLayer(idLayer);
            var currentOrder = self.getOrderLayer(idLayer)
            if(currentOrder > MaxOrderInGroup){
                MaxOrderInGroup = currentOrder
            }
        });
        MaxOrderInGroup = MaxOrderInGroup*demultiplicateurOrderLayer - parseInt(MaxOrderInGroup)*demultiplicateurOrderLayer;
        if(MaxOrderInGroup >= demultiplicateurOrderLayer-1){
            console.log("Le nombre maxi de couche dans le groupe à été atteint");
            return null;
        }

        if( typeof layerCap === 'undefined' || layerCap === null ){
            console.log("Error : Le layer " + layerName + " n'est pas disponible");
            newDiv = createUnavailableLayerDiv(thisOrder, layerName);
            groupDiv.find("#layers").prepend(newDiv);
            addTrashEvent(thisOrder, newDiv);
            return null;
        }


        idLayer = geoMap.addLayer(layerName, server);//We add the layer to the map and we get its unique identifier generated by the geoMap object.
        self.setOrderLayer(idLayer, thisOrder);// We set the zIndex of the layer (to control everything)
        idLayer = parseInt(idLayer);//We parse in int to be on but it is almost useless
        layerCapabilities[idLayer] = layerCap

        layersList.push([idLayer, layerName, layerDisplayName, layerGroupDisplayName]);
        

        newDiv = createLayerDiv(idLayer, layerName, layerDisplayName, thisOrder); //We create the div for the new layer
        groupDiv.find("#layers").prepend(newDiv); // and we add it to the list
        self.sortDivGroup();

        if(self.dimensionSlider !== undefined){
            self.dimensionSlider.sliderAddLayer(idLayer, layerCap);
            self.dimensionSlider.updateElevSlider(idLayer);
            self.dimensionSlider.updateTimeSlider(idLayer);
            
        }
        
        self.setActiveLayer(idLayer, layerManagerConfig.defaultLayerActive);
        self.setOpacity(idLayer, layerManagerConfig.defaultOpacity);
        //self.setEyeVisibility(idLayer, layerManagerConfig.defaultLayerActive);
        jsonWriter.newLayer(idLayer, layerName, layerDisplayName, currentGroupId, thisOrder, true, true, 1); // We update the json with this layer


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
    }

    var onLayerLoading = function(idLayer, div){
        self.geoMap.onLayerLoading(idLayer, function(){
            $(div).find(".loadingLayer").show();
            $(div).find("#eyeVisibility").hide()
        })
    } 
    var onLayerIsLoad = function(idLayer, div){
        self.geoMap.onLayerIsLoading(idLayer, function(){
            $(div).find(".loadingLayer").hide()
            $(div).find("#eyeVisibility").show();
        })
        $('[data-toggle="tooltip"]').tooltip(); 
    } 


    var getOrCreateGroupDiv = function(layerGroupDisplayName, forceGroupOrder){

        var idGroup = groupIds[layerGroupDisplayName];
        //If the group already exists
        if(idGroup != undefined && idGroup !=""){
            var div = jqueryLayerListDiv.find(".group-div#" + idGroup);
            if(div.length){
                return div
            }
        }
        //otherwise, create a new one
        var groupDiv = createGroup(layerGroupDisplayName, forceGroupOrder)
        
        jqueryLayerListDiv.prepend(groupDiv)
        return groupDiv;
    }

    var createGroup = function(layerGroupDisplayName, forceGroupOrder){
        groupId = groupId +1
        groupIds[layerGroupDisplayName] = groupId;

        groupOrder = groupOrder +1;
        actualGroupOrder = groupOrder;
        if(forceGroupOrder != undefined && forceGroupOrder >-1){
            actualGroupOrder = forceGroupOrder;
            if(forceGroupOrder > groupOrder){
                groupOrder = forceGroupOrder + 1; //to make sure that the next groups created do not encroach on already created groupOrder
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
    }

    var createGroupeDiv = function(idGroup, actualGroupOrder, layerGroupDisplayName){
        div = '<div class="group-div" id="' + idGroup +'" data-ordergroup="' + actualGroupOrder + '"><div class="group"><table width="100%" cellpadding="0" cellmargin="0" class="layer-conf "><tr><td class="cola"></td><td class="col2"></td><td class="col2b"></td><td class="col3 bgColor2Darker borderBottomColor2Darker"></td></tr></table></div><div id="layers"></div></div>';


        eyeVisibility = '<i id="gpEyeVisibility" class="fa fa-eye group-eye-visibility bgColor2" aria-hidden="true" data-toggle="tooltip" title="'+ trans["hideGroup"] + '"></i>';
        minusGroup = '<i id="gpMinus" class="fa fa-minus group-minus bgColor2" aria-hidden="true" data-toggle="tooltip" title="' + trans["hideGroup"] + '"></i>';
        label = '<div class="group-name"><label Color2><b>' + layerGroupDisplayName + '</b></label></div>';
        zoomOn = '<i class="fa fa-search-plus group-zoom Color2" aria-hidden="true" id="zoomOn" data-toggle="tooltip" title="'+ trans["zoomGroup"] +'"></i>';
        up = '<i class="fa fa-chevron-up Color2" aria-hidden="true" id="upGroup" data-toggle="tooltip" title="' + trans["upGroup"] +'"></i>';
        down = '<i class="fa fa-chevron-down Color2" aria-hidden="true" id="downGroup" data-toggle="tooltip" title="' + trans["upGroup"] +'"></i>';
        deleteGroup = '<i class="fa fa-trash trash-group bgColor2" aria-hidden="true" id="trashGroup" data-toggle="tooltip" title="' + trans["deleteGroup"] +'"></i>'

        newDiv = $(div);
        newDiv.find(".cola").append(eyeVisibility)
                            .append(minusGroup);
                       
        newDiv.find(".col2").append(label);
        newDiv.find(".col2b").append(zoomOn)
                                   .append(up)
                                   .append(down);
                        
        newDiv.find(".col3").append(deleteGroup);

        return newDiv;

    }

    /**
     * Allows the user to change the group name by clicking on it
     * @param {html} div  - Group div
     */
    var addChangeGroupNameEvent = function(groupId, div){
        var argDiv = div;
        $(div).find(".group-name").find("label").unbind('click');
        $(div).find(".group-name").find("label").click(function(){
            var value = $(this).text();
            var new_html = ('<input value="' + value + '"></input>' )
            $(this).replaceWith(new_html);
            $(div).find(".group-name").find("input").focus();
            $(div).find(".group-name").find("input").keypress(function (ev) {
                var keycode = (ev.keyCode ? ev.keyCode : ev.which);
                if (keycode == '13') {
                    changeGroupName(groupId, value, $(this), argDiv);
                }
            })
            $(div).find(".group-name").find("input").focusout(function(){
                changeGroupName(groupId, value, $(this), argDiv);
            })
        })
    }
    
    var changeGroupName = function(groupId, oldvalue, div, argDiv){
        var newVal = $(div).val();
        if(groupIds[newVal] !== undefined && newVal != oldvalue){
            alert("Ce group existe déjà");
            newVal = oldvalue;
        }else{
            groupIds[newVal] = groupIds[oldvalue]
            delete groupIds[oldvalue];
        }
        var new_html = ('<label><b>' + newVal + '</b></label>' );
        self.jsonWriter.setGroupDisplayName($(argDiv).attr("id"),newVal);
        $(div).replaceWith(new_html);
        addChangeGroupNameEvent(groupId, argDiv);
    }

    

    var getLayersList = function(){
        return layersList;
    }

    /**
     * Returns an array containing the active layer Id.
     */
    this.getAllActiveLayer = function(){
        var layersArray = [];
        $.each(getLayersList(), function(index, item){
            if(self.getActiveLayer(item[0])){
                layersArray.push(item);
            }
        })
        return layersArray;
    }



    /**
     * Load a layer list returned by the library object
     * @param {list} layerList - layer list key: layerName, value: Capabilities of layer
     */
    this.loadLibraryLayers = function(layerList, groupName){
        $.each(layerList, function(id, layerName){
            self.addLayer(layerName, "", groupName);
        });
    }


    /**
     * Create a div in the layerManager for a new layer
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {String} layerName - Layer name (workspace: layername)
     * @param {String} layerDisplayName - Name of the layer displayed to the user
     * @param {int} dataOrder - Index of the layer (the more the index is strong, the more the layer is found above the others)
     */
    var createLayerDiv = function(idLayer, layerName, layerDisplayName, dataOrder){
        //We create the different objects of the div
        div = '<div class="layer-conf" id="' + idLayer + '" data-layer="' + layerName + '" data-orderLayer="' + dataOrder + '"><table width="100%" cellpadding="0" cellmargin="0"><tr><td class="col1"></td><td class="col2"><div class="row line1"></div><div class="row line2 animated"></div></td><td class="col3 bgColor2Darker borderBottomColor2Darker"></td></tr></table></div>';
        eyeVisibility = '<i id="eyeVisibility" class="fa fa-eye eye-visibility color2darker" aria-hidden="true"  data-toggle="tooltip" data-layer="' + layerName + '" title="'+ trans["hideLayer"] + '"></i>';
        loadingLayer = '<i class="fa fa-spinner fa-spin fa-fw loadingLayer" id="' + idLayer + '" style="display:none;"></i>';

        label = createLabel(layerDisplayName); //I did this for when the user will want changed the name I will reuse this function // '<label class = "col-md-10 animated color2 labelLayerName"> <b>' + layerDisplayName + '</ b> < / label> ';
        updownLayer = '<i class="fa fa-chevron-up color1" aria-hidden="true" id="upLayer" data-toggle="tooltip" title="' + trans["upLayer"] +'"></i><i class="fa fa-chevron-down color1" aria-hidden="true" id="downLayer"  data-toggle="tooltip" title="'+ trans["downLayer"] +'"></i>';
        deleteLAyer = '<i class="fa fa-trash trash-layer color1" aria-hidden="true" id="trashLayer" data-toggle="tooltip" title="'+ trans["deleteLayer"] +'"></i>'
        extractMenu = createExtractMenu();
        separator = '<span class="separator"></span>';
        zoomOn = '<i class="fa fa-search-plus zoom-layer color1" aria-hidden="true" id="zoomOn" data-toggle="tooltip" title="'+ trans["zoomLayer"] +'"></i>';
        opacitySlider = '<input id="opacity"/><span class="opacity-percent" id="opacityPercent"></span>';
        legend = '<i class="fa fa-list get-legend color1" aria-hidden="true" id="getLegend" data-img="' + layerCapabilities[idLayer].Style[0].LegendURL[0].OnlineResource + '"></i>';

        //---We assemble all that
        newDiv = $(div);
        newDiv.find(".col1").append(eyeVisibility)
                            .append(loadingLayer);
        newDiv.find(".col2 .line1")/*.append(active)*/
                                   .append(label);
                       
        newDiv.find(".col2 .line2").append(separator)
                                   .append(opacitySlider)
                                   .append(zoomOn)
                                   .append(legend)
                                   .append(updownLayer);            
                        
        newDiv.find(".col3").append(deleteLAyer);
        
        //---L'aesthetic
        //the opacity slider
        newDiv.find("#opacity").slider({
            id: "opacitySlider",
            class: "gh-slider",
            value: 1,
            step : 0.05,
            min:  0,
            max: 1,
            tooltip: "hide"
        });        
        //And we return the new div correspsondante to the new layer
        return newDiv;
    }

    var createUnavailableLayerDiv = function(idLayer, layerName){
        div = '<div class="layer-conf" id="' + idLayer + '" data-layer="' + layerName + '" data-orderLayer="-1"><table width="100%" cellpadding="0" cellmargin="0"><tr><td class="col1"></td><td class="col2"><div class="row line1"></div><div class="row line2 animated"></div></td><td class="col3 bgColor2Darker borderBottomColor2Darker"></td></tr></table></div>';
        eyeVisibility = '<i id="eyeVisibility" class="fa fa-eye-slash eye-visibility color2darker" aria-hidden="true"  data-toggle="tooltip" title="'+ trans["hidenLayer"] +'"></i>';
        label = createLabel(layerName.replace(/\_/g, " "));
        unavailableLabel = '<label class="col-md-10 animated color2 unavailableLabel">' + trans['unavailableLayer'] + '</label>';
        deleteLAyer = '<i class="fa fa-trash trash-layer color1" aria-hidden="true" id="trashLayer" data-toggle="tooltip" title="'+ trans["deleteLayer"] +'"></i>'

        newDiv = $(div);
        newDiv.find(".col1").append(eyeVisibility);
        newDiv.find(".col2 .line1").append(label);
                       
        newDiv.find(".col2 .line2").append(unavailableLabel);            
                        
        newDiv.find(".col3").append(deleteLAyer);

        return newDiv;
    }

    /**
     * Function which creates the label of a layer // TODO: do the same thing for the labels of the groups
     * This function is also called when renaming the layer name
     * @param {String} value    value to display
     */
    var createLabel = function(value){
        return '<label class="col-md-10 animated labelLayerName"><b>' + value + '</b></label>';
    }

    /**
     * The menu plus for each layer
     * Not used at the moment
     */
    var createExtractMenu = function(){
        return '<div class="dropdown extract-menu pull-right"> \
            <i class="fa fa-ellipsis-h dropdown-toggle" data-toggle="dropdown" aria-hidden="true" id="extractMenu"></i> \
            <ul class="dropdown-menu pull-left" role="menu" style="left:auto;"> \
                <li><a href="#">Renommer la couche</a></li> \
                <li><a href="#">Autre action</a></li> \
            </ul> \
        </div>';
    }

    /**
     * Create the div containing the baseMap
     */
    this.createBaseMap = function(){
        //We create the different objects of the div
        div = '<div class="form-group base-map layer-conf" id="0"><table width="100%"><tr><td class="col1 bgColor2Darker"></td><td class="col2 animated"></td></tr></table></div>';
        //active = '<i class="fa fa-toggle-on color1" aria-hidden="true" id="active" data-toggle="tooltip" title="'+ trans["layerManagerHideMapBackground"] +'"></i>';
        eyeVisibility = '<i id="eyeVisibility" class="fa fa-eye eye-visibility color2darker" aria-hidden="true"  data-toggle="tooltip" title="'+ trans["layerManagerHideMapBackground"] + '"></i>';
        baseMaps = $('<select class="form-control animated" id="baseMapSelect">');
        defaultBaseMapName = "";
        $.each(self.geoMap.getBaseMaps(), function(name, source){
            value = name.split(' ').join('_')
            var option = $('<option value=' + value + '>' + name + '</option>');
            if(source.getVisible()){
                option.attr("selected", true);
                defaultBaseMapName = name;
            }
            baseMaps = baseMaps.append(option);
        });
        baseMaps = baseMaps.append('</select>');
        opacitySlider = '<input id="opacity"/><span class="opacity-percent" id="opacityPercent"></span>';

        //---We assemble all that
        newDiv = $(div)
        newDiv.find('.col1').append(eyeVisibility);
        newDiv.find('.col2').append(baseMaps)   
                            .append(opacitySlider);
        
        //---aesthetics
        //the opacity slider
        newDiv.find("#opacity").slider({
            id: "opacitySlider",
            value: 1,
            step : 0.05,
            min:  0,
            max: 1,
            tooltip: "hide"
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

    }


    
    /***********
     * EVENT MANAGEMENT
     */


    /**
     * Click on the toggle of the layer
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - div of the layer
     */
    var addActiveClickEvent = function(idLayer, div){
        
        $(div).find("#eyeVisibility").click(function(){
            if(self.getActiveGroupByIdLayer(idLayer)==false){
                return;
            }
            self.setActiveLayer(idLayer, !$(this).hasClass("fa-eye"));
            if(self.dimensionSlider!==undefined && $(this).hasClass("fa-eye")){ 
                //if the SliderSize are active and the layer has been activated,
                //we check that the slider accepts this layer otherwise we will gray out the eye (it is the dimensionSlider which will call the function to make the eye go gray)
                self.dimensionSlider.updateLayer(idLayer);
            }
        });
    }


    /**
     * Click on the zoom layer
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var addZoomLayerEvent = function(idLayer, div){
        $(div).find("#zoomOn").click(function(){
            self.geoMap.zoomToLayer(idLayer);
        });
    }

    /**
     * Change opacity (slider)
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var addOpacityEvent = function(idLayer, div){
        $(div).find("#opacity").change(function(){
            self.setOpacity(idLayer, $(this).val());
        });
    }

    /**
     * Click on up layer (The highest layer in the list is displayed on top of all other layers)
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var addUpEvent = function(idLayer, div){
        $(div).find("#upLayer").click(function(){
            var orderLayer = parseFloat(div.attr('data-orderLayer'));
            var above = div.prev(".layer-conf")
            if(above.hasClass("layer-conf")){
                newOrderLayer = parseFloat(above.attr('data-orderLayer'));
                self.setOrderLayer(above.attr('id'), orderLayer)
                self.setOrderLayer(idLayer, newOrderLayer)
            }else{
                //au dessus nok
                return;
            }                       
            self.sortDivLayer();
        })
    }

    /**
     * Click on down of the layer (The lowest layer in the list is displayed below all other layers)
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var addDownEvent = function(idLayer, div){
        $(div).find("#downLayer").click(function(){
            var orderLayer = parseFloat(div.attr('data-orderLayer'));
            var next = div.next(".layer-conf")
            if(next.hasClass("layer-conf")){
                newOrderLayer = parseFloat(next.attr('data-orderLayer'));
                self.setOrderLayer(next.attr('id'), orderLayer)
                self.setOrderLayer(idLayer, newOrderLayer)
            }else{
                //au dessus nok
                return;
            }                                                                 
            self.sortDivLayer();
        })
    }

    /**
     * Allows the user to change the name of the layer by clicking on it
     * @param {int} idLayer  - The ID of the layer (returned by geoMap ())
     * @param {html} div  - Layer div
     */
    var addChangeLayerNameEvent = function(idLayer, div){
        var argIdLayer = idLayer;
        var argDiv = div;
        $(div).find(".labelLayerName").unbind('click');
        $(div).find(".labelLayerName").click(function(){
            var value = $(this).text();
            var new_html = ('<input class="inputLayerLayerName" value="' + value + '"></input>' )
            $(this).replaceWith(new_html);
            $(div).find(".inputLayerLayerName").focus();
            $(div).find(".inputLayerLayerName").keypress(function (ev) {
                var keycode = (ev.keyCode ? ev.keyCode : ev.which);
                if (keycode == '13') {
                    changeLayerName($(this), argIdLayer, argDiv);
                }
            });
            $(div).find(".inputLayerLayerName").focusout(function(){
                changeLayerName($(this), argIdLayer, argDiv);
            })
        });
    }

    var changeLayerName = function(div, argIdLayer, argDiv){
        var newVal = $(div).val();
        var new_html = createLabel(newVal)
        self.jsonWriter.setlayerDisplayName(argIdLayer,newVal);
        $(div).replaceWith(new_html);
        addChangeLayerNameEvent(argIdLayer, argDiv);
    }
    

    /**
     * Click on the trash button
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var addTrashEvent = function(idLayer, div){
        $(div).find("#trashLayer").click(function(){
            trashLayer(idLayer, div);
        });
    }


    /**
     * When the user changes baseMap
     * @param {html} div - div de la baseMap 
     */
    var addChangeBaseMapEvent = function(div){
        $(div).change(function(){
            var newBaseMap = $(this).find("option:selected").text();
            var currentOpacity = jquerybaseMapDiv.find("#opacity").val();
            var currentActive = self.getActiveLayer(0);
            self.setBaseMap(newBaseMap);
            self.setActiveLayer(0, currentActive);
            self.setOpacity(0, currentOpacity);
        })
    }

    /**
     * At the flyover of the legend button display of the legend
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var addDisplayLegend = function(idLayer, div){
        $(div).find("#getLegend").popover({
        html: true,
        trigger: 'hover',
        placement: 'bottom',
        content: function(){return '<img src="'+$(this).data('img') + '" />';}
        });
    }


    /**
     * Delete a layer
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {html} div - Layer div
     */
    var trashLayer = function(idLayer, div){
        self.geoMap.removeLayer(idLayer); //Delete all
        self.jsonWriter.removeLayer(idLayer);
        $(div).toggle(function () { // And we will check if groups are empty to delete them too!
            $(this).remove();
            clearEmptyGroup();
        });
        if(self.dimensionSlider!==undefined){
            self.dimensionSlider.sliderRemoveLayer(idLayer, layerCapabilities[idLayer]);
            self.dimensionSlider.updateElevSlider(idLayer);
            self.dimensionSlider.updateTimeSlider(idLayer);
        }
    }

    /**
     * Delete all groups no contains layer
     */
    var clearEmptyGroup = function(){
        jqueryLayerListDiv.find(".group-div").each(function(){
            if($(this).find("#layers").find(".layer-conf").length <= 0){
                $(this).remove();
                var groupId = $(this).attr("id");
                self.jsonWriter.removeGroup(groupId)
                var objKey = undefined;
                $.each(groupIds, function(index, value){
                    if(value == groupId){
                        objKey = index;
                    }
                });
                if(objKey){
                    delete groupIds[objKey]
                }
                
            }
        })
    }


    var addZoomGroupEvent = function(idGroup, div){
        $(div).find("#zoomOn").click(function(){
            var idLayers = getAllIdLayersGroup(idGroup)
            self.geoMap.zoomToLayers(idLayers);
        });
    }

    /**
     * Click on up group (The highest group in the list is displayed above all other layers)
     * @param {int} idGroup - Group ID
     * @param {html} div - Group div
     */
    var addUpGroupEvent = function(idGroup, div){
        $(div).find("#upGroup").click(function(){

            var orderGroup = parseFloat(div.attr('data-ordergroup'));
            var above = div.prev(".group-div")
            if(above.hasClass("group-div")){
                newOrderGroup = parseFloat(above.attr('data-ordergroup'));
                self.setOrderGroup(above.attr('id'), orderGroup)
                self.setOrderGroup(idGroup, newOrderGroup)
            }else{
                //au dessus nok
                return;
            }                       
            self.sortDivGroup();
        })
    }

    /**
     * Click group down (The lowest group in the list is displayed below all other layers)
     * @param {int} idGroup - Group ID
     * @param {html} div - Group div
     */
    var addDownGroupEvent = function(idGroup, div){
        $(div).find("#downGroup").click(function(){
            var orderGroup = parseInt(div.attr('data-ordergroup'));
            var next = div.next(".group-div");
            if(next.hasClass("group-div")){
                newOrderGroup = parseFloat(next.attr('data-ordergroup'));
                self.setOrderGroup(next.attr('id'), orderGroup)
                self.setOrderGroup(idGroup, newOrderGroup)
            }else{
                //au dessus nok
                return;
            }
            self.sortDivGroup();
        })
    }

    



    

    /**
     * When the user opens or replicates a group
     * @param {int} idGroup - Group ID
     * @param {html} div - Group div
     */
    var addMinimizeGroupEvent = function(idGroup, div){
        $(div).find("#gpMinus").click(function(){
            self.setMinimizeGroup(idGroup, !$(this).hasClass("fa-plus"))
        });
    }

    /**
     * When the user clicks on the group eye
     * @param {int} idGroup - Group ID
     * @param {html} div - Group div
     */
    var addActiveGroupEvent = function(idGroup, div){

        $(div).find("#gpEyeVisibility").click(function(){
            self.setActiveGroup(idGroup, !$(this).hasClass("fa-eye"));
            if(self.dimensionSlider!==undefined && $(this).hasClass("fa-eye")){ 
                //if the SliderSize are active and the layer has been activated,
                //we check that the slider accepts this layer otherwise we will gray out the eye (it is the dimensionSlider which will call the function to make the eye go gray)
                $.each(getAllIdLayersGroup(idGroup), function(index, idLayer){
                    self.dimensionSlider.updateLayer(idLayer);
                });
               
            }
        });
    }

    /**
     * When the user wants to delete a group
     * @param {html} div - Group div 
     */
    var addTrashGroupEvent = function(idGroup, div){
        $(div).find("#trashGroup").click(function(){
            getAllLayersGroup(idGroup).each(function(){
                trashLayer($(this).attr('id'), $(this));
            });
            clearEmptyGroup();
        });
    }



    /**
     * Returns a div list of all layers in a group
     * @param {Int} groupId - Id du group
     */
    var getAllLayersGroup = function(groupId){
        var allLayers = jqueryLayerListDiv.find(".group-div#" + groupId).find("#layers").find(".layer-conf");
        return allLayers;
    }

    /**
     * Returns a list containing all layer idLayers present in a group
     * @param {Int} groupId - Id du group
     */
    var getAllIdLayersGroup =function(groupId){
        var idLayers = [];
        var allLayers = getAllLayersGroup(groupId);
        allLayers.each(function(){
            idLayers.push(parseInt($(this).attr('id')))
        });
        return idLayers;
    }

    /***********
     * SETTER
     */


    /**
     * Sets the opacity of a layer
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {float} opacity - Opacity to apply on the layer
     */
    this.setOpacity = function(idLayer, opacity){
        if(opacity>1){opacity=1;}
        if(opacity<0){opacity=0;}
        var jqueryDiv = jqueryLayerListDiv
        if(idLayer == 0){
            jqueryDiv = jquerybaseMapDiv;
        }
        div = jqueryDiv.find(".layer-conf#" + idLayer).find("#opacity").slider('setValue', opacity);
        jqueryDiv.find(".layer-conf#" + idLayer).find("#opacityPercent").text(parseInt(opacity*100) + " %"); 
        self.geoMap.changeOpacity(idLayer, opacity);
        self.jsonWriter.setOpacity(idLayer, opacity);
        if(idLayer > 0 ){
            self.jsonWriter.setOpacity(idLayer, opacity);
        }else{
            self.jsonWriter.setBaseMapOpacity(opacity);
        }
    }

    /**
     * Sets the visibility of a layer
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {bool} visibility - if true displays the layer (and the eye), the cache and bars the eye if not
     */
    this.setActiveLayer = function(idLayer, visibility){
        var jqueryDiv = jqueryLayerListDiv
        if(idLayer == 0){
            jqueryDiv = jquerybaseMapDiv;
        }
        if(visibility){

            jqueryDiv.find(".layer-conf#" + idLayer).find("#eyeVisibility").removeClass("fa-eye-slash").addClass("fa-eye");
            jqueryDiv.find(".layer-conf#" + idLayer).find("#eyeVisibility").attr('title',trans["hideLayer"]);
            jqueryDiv.find(".layer-conf#" + idLayer).find("#eyeVisibility").attr('data-original-title',trans["hideLayer"]);
            if(idLayer==0){//If it was the baseMap
                jqueryDiv.find(".layer-conf#" + idLayer).find("#eyeVisibility").attr('title',trans["layerManagerHideMapBackground"]);
                jqueryDiv.find(".layer-conf#" + idLayer).find("#eyeVisibility").attr('data-original-title',trans["layerManagerHideMapBackground"]);
            }
            jqueryDiv.find(".layer-conf#" + idLayer).removeClass('inactiveLayer');                                                                                                         
        }else{
            jqueryDiv.find(".layer-conf#" + idLayer).find("#eyeVisibility").removeClass("fa-eye").addClass("fa-eye-slash");
            jqueryDiv.find(".layer-conf#" + idLayer).find("#eyeVisibility").attr('title',trans["showLayer"]);
            jqueryDiv.find(".layer-conf#" + idLayer).find("#eyeVisibility").attr('data-original-title',trans["showLayer"]);
            if(idLayer==0){//If it was the baseMap
                jqueryDiv.find(".layer-conf#" + idLayer).find("#eyeVisibility").attr('title',trans["layerManagerShowMapBackground"]);
                jqueryDiv.find(".layer-conf#" + idLayer).find("#eyeVisibility").attr('data-original-title',trans["layerManagerShowMapBackground"]);
            }
            jqueryDiv.find(".layer-conf#" + idLayer).addClass('inactiveLayer');
        }
        self.geoMap.setLayerVisibility(idLayer, visibility);
        if(idLayer > 0 ){
            self.jsonWriter.setActive(idLayer, visibility);
        }else{
            self.jsonWriter.setBaseMapActive(visibility);
        }
    }

    this.setActiveGroup = function(idGroup, visibility){
        if(visibility){
            jqueryLayerListDiv.find(".group-div#" + idGroup).find(".group").find("#gpEyeVisibility").removeClass("fa-eye-slash").addClass("fa-eye");
        }else{
            jqueryLayerListDiv.find(".group-div#" + idGroup).find(".group").find("#gpEyeVisibility").removeClass("fa-eye").addClass("fa-eye-slash");
        }
        $.each(getAllIdLayersGroup(idGroup), function(index, idLayer){
            if(visibility){
                if(self.getActiveLayer(idLayer)){
                    self.geoMap.setLayerVisibility(idLayer, visibility);
                    jqueryLayerListDiv.find(".layer-conf#" + idLayer).removeClass('inactiveLayer');
                }
            }else{
                self.geoMap.setLayerVisibility(idLayer, visibility);
                jqueryLayerListDiv.find(".layer-conf#" + idLayer).addClass('inactiveLayer');
            }
        });
        self.jsonWriter.setActiveGroup(idGroup, visibility);
    }


    /**
     * Sets the index of a layer (the higher the index, the more the layer is displayed below the others)
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     * @param {int} order - layer index
     */
    this.setOrderLayer = function(idLayer, order){
        jqueryLayerListDiv.find(".layer-conf#" + idLayer).attr('data-orderLayer', order);
        self.jsonWriter.setLayerOrderInGroup(idLayer, order);
        self.geoMap.changeLayerIndex(idLayer,order);
    }

    this.getOrderLayer = function(idLayer){
        return jqueryLayerListDiv.find(".layer-conf#" + idLayer).attr('data-orderLayer');
    }

    /**
     * Sets the group order (the larger the group, the smaller the group is displayed below the others)
     * The group order displays and changes the order of the layers of the group to ensure consistency
     * @param {int} idGroup - Group ID
     * @param {int} order - order du group 
     */
    this.setOrderGroup = function(idGroup, order){
        $.each(getAllIdLayersGroup(idGroup), function(index, idLayer){
            var actualLayerOrder = parseFloat(jqueryLayerListDiv.find(".layer-conf#" + idLayer).attr('data-orderLayer'));
            var newLayerOrder = actualLayerOrder + parseInt((parseInt(order) - parseInt(actualLayerOrder))); // Grand calcul scientifique
            self.setOrderLayer(idLayer, newLayerOrder);
        });
        jqueryLayerListDiv.find(".group-div#" + idGroup).attr('data-ordergroup', order);
        self.jsonWriter.setGroupOrder(idGroup, order);
    }

    /**
     * Define the background
     * @param {String} newBaseMap  - The name of the new baseMap
     */
    this.setBaseMap = function(newBaseMap){
        self.geoMap.changeBaseMap(newBaseMap);
        var value = newBaseMap.split(' ').join('_')
        jquerybaseMapDiv.find("select").val(value);
        self.jsonWriter.setBaseMapName(newBaseMap);
    }

    this.getActiveGroup = function(idGroup){
        return jqueryLayerListDiv.find(".group-div#" + idGroup).find(".group").find("#gpEyeVisibility").hasClass("fa-eye");
    }

    this.getActiveGroupByIdLayer = function(idLayer){
        var idGroup = jqueryLayerListDiv.find(".layer-conf#" + idLayer).closest( ".group-div" ).attr("id");
        return self.getActiveGroup(idGroup);
    }


    /**
     * Returns true if the layer is active
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     */
    this.getActiveLayer = function(idLayer){
        var jqueryDiv = jqueryLayerListDiv
        if(idLayer == 0){
            jqueryDiv = jquerybaseMapDiv;
        }
        return jqueryDiv.find(".layer-conf#" + idLayer).find("#eyeVisibility").hasClass("fa-eye")
    }

    /**
     * Lets you know the state of the eye of visibility for a layer. Returns true if the eye is active
     * @param {int} idLayer - The ID of the layer (returned by geoMap ())
     */
    this.getEyeVisibility = function(idLayer){
        var jqueryDiv = jqueryLayerListDiv
        if(idLayer == 0){
            jqueryDiv = jquerybaseMapDiv;
        }
        return jqueryDiv.find(".layer-conf#" + idLayer).find("#eyeVisibility").hasClass("fa fa-eye")
    }

    /**
     * Lets you sort layerManager div / layers according to the order / index of the layers (the strongest index is at the top).
     */
    this.sortDivLayer = function(){
        jqueryLayerListDiv.find(".group-div").each(function(){
            var groupDiv = $(this).find("#layers");
            groupDiv.children("div").sort(function(a, b){
                return $(a).attr("data-orderLayer")-$(b).attr("data-orderLayer");
            }).each(function(){
                groupDiv.prepend(this);
            });

        })
    }

    /**
     * Lets you sort the div / group of the layerManager according to the order / index of the groups (the strongest index is at the top).
     */
    this.sortDivGroup = function(){
        
        jqueryLayerListDiv.children(".group-div").sort(function(a, b){
            return $(a).attr("data-ordergroup")-$(b).attr("data-ordergroup");
        }).each(function(){
            jqueryLayerListDiv.prepend(this);
        });
    }


    /**
     * Change the open / collapsed state of a group
     * @param {int} idGroup - Group ID
     * @param {bool} minimize - true to minimize the group
     */
    this.setMinimizeGroup = function(idGroup, minimize){
        if(minimize){
            jqueryLayerListDiv.find(".group-div#" + idGroup).find(".group").find("#gpMinus").removeClass("fa-minus").addClass("fa-plus");
            //TODO : change title and data-roginal-title
            jqueryLayerListDiv.find(".group-div#" + idGroup).find("#layers").hide("slow");
        }else{
            jqueryLayerListDiv.find(".group-div#" + idGroup).find(".group").find("#gpMinus").removeClass("fa-plus").addClass("fa-minus");
            //TODO : change title and data-roginal-title
            jqueryLayerListDiv.find(".group-div#" + idGroup).find("#layers").show("slow");
        }
        self.jsonWriter.setMinmizeGroupe(idGroup, minimize);
    }

    

     /***********
     * LODERJSON
     */


    this.checkMapCookies = function(){
        var jsonMap = self.jsonWriter.readMapCookie();
        if(jsonMap != ""){
            self.loadJsonMap(jsonMap);
        }
    }

    /**
     * Load a Json card
     * @param {JSONString} jsonMap - String Json corresponding to the card to be loaded
     */
    this.loadJsonMap = function(jsonMap){
        jsonObj = JSON.parse(jsonMap);
        self.removeAllLayer();
        self.dimensionSlider.resetDimensionSlider();

        if(jsonObj == undefined || jsonObj == ""){
            console.log("Erreur de chargement de la jsonMap");
            return;
        }

        if(jsonObj.mapName !==undefined && jsonObj.mapName  != ""){
            layerManagerConfig.mapName = jsonObj.mapName;
        }

        if(jsonObj.layers != "" || jsonObj.layers !==undefined){
            $.each(jsonObj.layers, function(index, layerItem){
                //You have to find the displayName of the group
                var groupDisplayName = undefined;
                if(jsonObj.layerGroups != "" || jsonObj.layerGroups !==undefined){
                    $.each(jsonObj.layerGroups, function(index, groupItem){
                        if(groupItem.groupName == layerItem.layerGroupName){
                            groupDisplayName = groupItem.groupDisplayName
                        }
                    })
                }
                var idLayer =self.addLayer(layerItem.layerName, layerItem.layerDisplayName, groupDisplayName);
                if(idLayer == null){
                    return true; //continue
                }
                self.setActiveLayer(idLayer, layerItem.active);
                self.setOpacity(idLayer, layerItem.opacity);
                self.setOrderLayer(idLayer, layerItem.layerOrderInGroup)
            });
            self.sortDivLayer();
        }

        if(jsonObj.layerGroups != "" || jsonObj.layerGroups !==undefined){
            $.each(jsonObj.layerGroups, function(index, groupItem){
                var groupDiv = getOrCreateGroupDiv(groupItem.groupDisplayName);
                var currentGroupId = groupDiv.attr('id');
                self.setActiveGroup(currentGroupId, groupItem.groupActive);
                self.setMinimizeGroup(currentGroupId, groupItem.minimize);
            })
        }

        if(jsonObj.baseMap != "" || jsonObj.baseMap !== undefined){
            var newBaseMapName = jsonObj.baseMap.baseMapName;
            var newBaseMapOpacity = jsonObj.baseMap.opacity;
            var newBaseMapActive = jsonObj.baseMap.active;
            self.setBaseMap(newBaseMapName);
            self.setActiveLayer(0, newBaseMapActive);
            self.setOpacity(0, newBaseMapOpacity);
        }

        if(jsonObj.extent && jsonObj.extentEPSG){
            self.geoMap.setMapCenter(jsonObj.extent, jsonObj.extentEPSG);
        }
        if(jsonObj.zoom){
            self.geoMap.setZoom(jsonObj.zoom);
        }
    }


    /**
     * Lets you update the size of the div containing the list of layers
     * @param {float} size - Size of the div map
     */
    this.updateDivLayerListSize = function(size){

        var maxHeightLayerList = size;
        jqueryLayerListDiv.css("max-height", maxHeightLayerList);											 
    }
  




/**
 * END OF layerManager Object
 */
}