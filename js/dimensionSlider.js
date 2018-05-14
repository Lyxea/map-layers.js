//Pour les slider, permet de les centrer à gauche et à droite
jQuery.fn.centerHorizontal = function () {
    this.css("position","absolute");
    var widthmapcurrent = $(".map").width()/*-$(".control-sidebar").outerWidth()*/;
    /*this.css("width", 80*(widthmapcurrent)/100);*/
    /*this.css("left", 10*(widthmapcurrent)/100);*/
    return this;
}
jQuery.fn.centerVertical = function () {
    this.css("position","absolute");
    this.css("top", Math.max(0, (($(".map").height() - $(this).outerHeight()) / 2) + $(".map").scrollTop()) + "px");
    return this;
}

var dimensionSlider = function(elevDiv, timeDiv){

    var self = this;

    var ISO8601 = new Date("1990-11-25T12:00:00.000Z");
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

    this.resetDimensionSlider = function(){
        elevIdLayers = [];
        timeIdLayers = [];
        slTimeValues = {};
        slTimeFloatValues = {};
        slElevValues = {};
    }

    /**
     * Permet de mettre à jour un paramètre d'un layer
     * Le callback prend en paramètre l'id du layer, le nom du param et sa value
     * @param {callback} callkack - Fcuntion qui permet de mettre à jour un parmètre d'un layer
     */
    this.setCallbackUpdateParam = function(callkack){
        callBackGeoMapUpdateParam = callkack;
    }

    /**
     * Permet de mettre à jour l'eye de visibilité du LayerManager pour un layer donnée.
     * Lorsque les config des sliders ne permettent pas un affichage d'un layer, celui aura l'eye de visbilité inactif.
     * Cette fonction prend en paramètre l'id du layer et un boolean de visibilité
     * @param {callback} callkack - Function qui permet de changer l'eye de visibilité d'un layer
     */
    this.setCallbackChangeVisiblity = function(callkack){
        callbackLMChangeVisibility = callkack;
    }

    /**
     * Transforme une date au format ISO 8601 en float (nombre de jour depuis 1990-11-25T12:00:00.000Z)
     * @param {string} dateString - Date ISO8601 à transformer
     */
    var ISO8601ToFloat = function(dateString){
        date = new Date(dateString);
        val = (date - ISO8601)/ISO8601_diviseur;
        return val;
    }
    
    /**
     * Transforme un float au format date ISO 8601
     * @param {float} floatValue - Nombre de jour depuis 1990-11-25T12:00:00.000Z
     */
    var floatToISO8601 = function(floatValue){
        var copiedISO8601 = new Date(ISO8601.getTime());
        copiedISO8601.setHours(copiedISO8601.getHours() + parseInt(floatValue));
        return copiedISO8601;
    }

    /**
     * Cette fonction applique le callback donnée sur chaque valeur de chacune des dimension.
     * Le callback est appelé avec le tableau slTimeValues pour la dimension time et slElevValues pour la dimensions elevation
     * @param {int} idLayer - L'ID du layer (retourné par geoMap())
     * @param {xml} layerCapabilities - Capabilities du layer
     * @param {Function} callback - Fonction qui sera appelé pour chaque valeur présentes pour cahque dimension
     */
    var sliderAddOrRemoveLayer = function(idLayer, layerCapabilities, callback){
        if(layerCapabilities === undefined){
            return;
        }
        $.each(layerCapabilities.Dimension, function(index, dimObject){
            currentVal = dimObject.values.split(",");
            $.each(currentVal, function(index, value){
                if(dimObject.name == "time"){
                    //if($.inArray(idLayer, timeIdLayers)<0){timeIdLayers.push(idLayer)}
                    callback(slTimeValues, value, timeIdLayers);
                }
                else{
                    if(dimObject.name == "elevation"){
                        //if($.inArray(idLayer, elevIdLayers)<0){elevIdLayers.push(idLayer)}
                        callback(slElevValues, parseInt(value), elevIdLayers);
                    }
                }
            });
        });
    }

    /**
     * Permet d'ajouter un layer au slider
     * @param {int} idLayer - L'ID du layer (retourné par geoMap())
     * @param {xml} layerCapabilities - Capabilities du layer
     */
    this.sliderAddLayer = function(idLayer, layerCapabilities){
        if(layerCapabilities === undefined || layerCapabilities.Dimension === undefined){ // le Layer n'a pas de dimension
            return;
        }
        sliderAddOrRemoveLayer(idLayer, layerCapabilities, function(array, value, idArray){
            if($.inArray(idLayer, idArray)<0){idArray.push(idLayer)}
            if(!array[value]){array[value]=[];} // Init l'array s'il n'existe pas encore
            if($.inArray(idLayer, array[value]) < 0){ //si IdLayer n'est pas dans array
                array[value].push(idLayer);
            }
        });
    }
    
    /**
     * Permet de supprimer un layer au slider
     * @param {int} idLayer - L'ID du layer (retourné par geoMap())
     * @param {xml} layerCapabilities - Capabilities du layer
     */
    this.sliderRemoveLayer = function(idLayer, layerCapabilities){
        timeIdLayers = jQuery.grep(timeIdLayers, function(value) {
            return value != idLayer;
        });
        elevIdLayers = jQuery.grep(elevIdLayers, function(value) {
            return value != idLayer;
        });
        sliderAddOrRemoveLayer(idLayer, layerCapabilities, function(array, value, idArray){
            if(array[value]){
                array[value] = jQuery.grep(array[value], function(valueIter) {
                    return valueIter != idLayer;
                });
                if(array[value].length<=0){
                    delete array[value];
                }
            }
        });
    }

    /**
     * Permet de mettre à jour le slider des elevations avec les informations du layer donné en param
     * @param {int} idLayer - L'ID du layer (retourné par geoMap())
     */
    this.updateElevSlider = function(idLayer){
        var elevValues = Object.keys(slElevValues);
        var oldValue = $("#slider_layer_input").val()
        $("#"+elevDiv).html("");
        $("#"+elevDiv).hide();
        if(elevValues.length<=1){
            return;
        }
        
        
        if(oldValue == "" || oldValue === undefined || oldValue === null){
            oldValue = Math.min.apply(null, elevValues)
        }
        var timeVal = -1;
        if($("#"+timeDiv).find("#slider_time_input")!==undefined){
            var timeVal = $("#"+timeDiv).find("#slider_time_input").val();
        }

        $("#"+elevDiv).show();
        $("#" + elevDiv).append("<span class='textColor1'>"+trans["level"]+"</span><i class='fa fa-caret-up fa-2x sl-up color1Hover' id='up_elev' aria-hidden='true'></i><input id='slider_layer_input' class='dim2-slider'><i class='fa fa-caret-down fa-2x color1Hover sl-down' id='down_elev' aria-hidden='true'></i>");
        var slider_layer = $("#slider_layer_input").slider({
            value:oldValue,
            step : 1.0,
            min: Math.min.apply(null, elevValues),
            max: Math.max.apply(null, elevValues),
            ticks: elevValues,
            orientation: 'vertical'
        }).on('slideStop', function() {
            $.each(timeIdLayers, function(index, item){
                self.updateLayer(item);
            })
        });
        $("#"+elevDiv).centerVertical();
        $("#slider_layer_input").trigger( "slideStop" );

        /**
         * Lorsque l'utilisateur clique sur les fleches up et down
         */
        $("#"+elevDiv).find("#down_elev").click(function(){
            if($("#slider_layer_input").val() >=  Math.max.apply(null, elevValues)){
                return;
            }
            var actualIndex = $("#slider_layer_input").val();
            var newVal = elevValues[actualIndex];
            $("#slider_layer_input").slider('setValue', newVal);
            $("#slider_layer_input").trigger( "slideStop" );
        });
        $("#"+elevDiv).find("#up_elev").click(function(){
            if($("#slider_layer_input").val() <=  Math.min.apply(null, elevValues)){
                return;
            }
            var actualIndex = $("#slider_layer_input").val();
            var newVal = elevValues[actualIndex-2];
            $("#slider_layer_input").slider('setValue', newVal);
            $("#slider_layer_input").trigger( "slideStop" );
        });
        
    }

    /**
     * Permet de mettre à jour le slider des Time avec les informations du layer donné en param
     * @param {int} idLayer - L'ID du layer (retourné par geoMap())
     */
    this.updateTimeSlider = function(idLayer){

        let timeValues = Object.keys(slTimeValues);
    
        var timeTransformValues = [];
        $.each(timeValues, function(index, value){
            timeTransformValues.push(ISO8601ToFloat(value));
        })
        var timeTransformeKeyValues = {}; // Permet d'avoir une map où la clé est le chiffre correspondant au time et la value est un array des layer dispo
        $.each(slTimeValues, function(index, value){
            var newIndex = ISO8601ToFloat(index).toString() + " "
            if(!timeTransformeKeyValues[newIndex]){timeTransformeKeyValues[newIndex]=[];}
            $.each(value, function(index, val){
                timeTransformeKeyValues[newIndex].push(val);
            })
        });
        
        var oldValue = $("#slider_time_input").val()
        $("#"+timeDiv).html("");
        $("#"+timeDiv).hide();
        if(timeTransformValues.length<=1){
            return;
        }
        if(oldValue == "" || oldValue === undefined || oldValue === null){
            oldValue = Math.min.apply(null, timeTransformValues)
        }
        var elevVal = -1;
        if($("#"+elevDiv).find("#slider_layer_input")!==undefined){
            var elevVal = $("#"+elevDiv).find("#slider_layer_input").val();
        }
       
        $("#"+timeDiv).show();
        $("#" + timeDiv).append("<span class='textColor1 col-md-2'>" + trans["time"] +"</span> <span class='col-md-10'><i class='fa fa-caret-left fa-2x sl-left color1Hover' id='down_time' aria-hidden='true'></i><input id='slider_time_input'><i class='fa fa-caret-right fa-2x color1Hover sl-right' id='up_time' aria-hidden='true'></i></span>");
        $("#slider_time_input").slider({
            value: oldValue,
            step : 1,
            min:  Math.min.apply(null, timeTransformValues),
            max: Math.max.apply(null, timeTransformValues),
        }).on('slideStop', function() {
            $.each(elevIdLayers, function(index, item){
              
                self.updateLayer(item);
            })
        });

        $("#"+timeDiv).centerHorizontal();
        $("#slider_time_input").trigger( "slideStop" );

        /**
         * Lorsque l'utilisateur clique sur les fleches up et down
         */
        $("#"+timeDiv).find("#down_time").click(function(){
            if($("#slider_time_input").val() <=  Math.min.apply(null, timeTransformValues)){
                return;
            }
            var newVal = timeTransformValues[$("#slider_time_input").val()-1];
            $("#slider_time_input").slider('setValue', newVal);
            $("#slider_time_input").trigger( "slideStop" );
        });
        $("#"+timeDiv).find("#up_time").click(function(){
            if($("#slider_time_input").val() >= Math.max.apply(null, timeTransformValues)){
                return;
            }
            var newVal = timeTransformValues[parseInt($("#slider_time_input").val())+1];
            $("#slider_time_input").slider('setValue', newVal);
            $("#slider_time_input").trigger( "slideStop" );
        });
        
    }


    /**
     * Permet de mettre à jour un layer, param et autre (lorsqu'il vient d'être re-activé par le layermanager par exemple)
     * @param {int} idLayer - L'ID du layer (retourné par geoMap())
     */
    this.updateLayer = function(idLayer){
        if(($.inArray(idLayer, elevIdLayers)<0) && ($.inArray(idLayer, timeIdLayers)<0)){
            //Ce layer n'a pas de dimension, on s'en occupe pas
            return;
        }
        var timeVal;
        var elevVal;
        var availableTime = false;
        var availableElev = false;
        if($("#"+timeDiv).find("#slider_time_input")!==undefined){
            timeVal = $("#"+timeDiv).find("#slider_time_input").val();
        }
        if($("#"+elevDiv).find("#slider_layer_input")!==undefined){
            elevVal = $("#"+elevDiv).find("#slider_layer_input").val();
        }
        $.each(slTimeValues, function(index, item){
            if(timeVal == ISO8601ToFloat(index)){
                if($.inArray(idLayer, item)>=0){
                    //Time disponible
                    availableTime = true;
                    callBackGeoMapUpdateParam(idLayer, "TIME", index)
                }
            }
        });

        if(slElevValues[elevVal]){
            if($.inArray(idLayer, slElevValues[elevVal])>=0){
                //Elev disponible
                availableElev = true;
                callBackGeoMapUpdateParam(idLayer, "ELEVATION", elevVal)
            }
        }
        if(availableElev == false || availableTime == false){
            //Si un des deux param n'est pas dispo pour cette couche, on la cache
            callbackLMChangeVisibility(idLayer, false);

        }
    } 
    


    /**
     * END OF dimensionSlider Object
     */
}