var mapLayer = function (config){
    var defaults = {
        lang: 'en',
        map: {
            divMap: 'map',
            geoMapConfig: {
                defaultBaseMap: "OSM",
                defaultXCenter: 2,
                defaultYCenter: 48,
                defaultZoomLevel: 5
            },
            geoserverName: '<yourGeoServerURL>',
            workspaceLimit: ['<workspaceName[:workspaceDisplayName]>', '<workspaceName[:workspaceDisplayName]>'],
            keyBING: '<yourBingKey>',
        },
        layerManager: {
            height: '',
            divLayerManagerModal: "layerManagerModal",
            divLayerManager: "layerManager",
            divSaveMapModal: "LMSaveMapModal",
            config: {
                defaultOpacity: 1,
                defaultLayerActive: true
            }
        },
        dynSlider: {
            divMapLevelAxe: "slider_elev",
            divMapTimeAxe: "slider_time",
        }
    };
    
    function overrideExistedKey(obj){
        $.each(obj,function(key1,value1){
            if (typeof (defaults[key1])=='object'){
                $.each(obj[key1], function (key2, value2) {
                    if (typeof (defaults[key1][key2]) == 'object') {
                        $.each(obj[key1][key2], function (key3, value3) {
                            defaults[key1][key2][key3] = value3
                        })
                    }else{
                        defaults[key1][key2] = value2  
                    }
                })      
            }else{
                defaults[key1] = value1    
            }  
        })
    } 
   
       
    if (typeof(config)=='object'){  
        overrideExistedKey(config)           
    }
    config = defaults;
     
    var self = this; 
    
	var layerManagerConfig = config.layerManager.config
	self.map = new geoMap(config.map.divMap, config.map.geoserverName, config.map.keyBING);
	self.myJsonWriter = new jsonWriter();
	self.myDimensionSlider = new dimensionSlider(config.dynSlider.divMapLevelAxe, config.dynSlider.divMapTimeAxe);
	self.myLibrary = new library(config.layerManager.divLayerManagerModal, config.map.geoserverName, config.map.workspaceLimit)
	self.layerManager = new layerManager(config.layerManager.divLayerManager, self.map, self.myJsonWriter, self.myDimensionSlider, self.myLibrary, config.layerManager.config)
	self.saveLoadMap = new saveLoadMap(config.layerManager.divSaveMapModal, [], "#", "")
	self.map.initMap(config.map.geoMapConfig);
	self.layerManager.init();
	self.myLibrary.createModalListLayer();
	self.layerManager.createBaseMap();
	self.saveLoadMap.init();
	self.layerManager.addCrud(self.myLibrary.openLibrary, self.saveLoadMap.openSaveMapModal, self.saveLoadMap.openLoadMapModal);
	self.myLibrary.addLayers(self.layerManager.loadLibraryLayers);
	
	$('[data-toggle="tooltip"]').tooltip();        
	
	$(window).resize(function () {
		if (config.layerManager.height === "") {
			self.layerManager.updateDivLayerListSize($(window).height() - $('#contenairConfig').height() - $('.layer-manager-title').outerHeight() - $('.map-title-first').outerHeight())
		} else {
			self.layerManager.updateDivLayerListSize(config.layerManager.height);
		}
		self.map.updateDivMapSize
	}).resize();
}