# INTRODUCTION


This project was realized thanks to an H2020 research project named Aquanes (http://aquanes-h2020.eu).

LYXEA Map-layer.js is a javascript/html project to allow you to create easily a map layer manager in your website. Map-layer.js works with OpenLayers.

LYXEA Map-layer.js is customizable as you desire: you can place your map and layer manager where you want in the webpage. Active or not each object or also pass your own olMap to the layer-manager.

**LYXEA Map-layer.js compatibility :**
IE : ie8,ie9,ie10, edge
Chrome
Firefox

# REQUIREMENTS
Note that this library depends on `jQuery >= 3.1.0` 
It's necessary to get lib folder containing :
`bootstrap.min.js`
`bootstrap-slider.js`
`geoMap.js`
`jsonWriter.js`
`dimensionSlider.js`
`layerManager.js`
`library.js`
`saveLoadMap.js`
`ol.js`


# INSTALLATION
  To start add following lines in head tag of page:
```html
<!--SCRIPTS-->
<script src="lib/jquery-3.1.1.min.js"></script>
<script src="js/map-layer.js"></script>

<!--STYLES-->
<link rel="stylesheet" type="text/css" href="lib/bootstrap.min.css">
<link rel="stylesheet" href="lib/bootstrap-slider.css" />
<link rel="stylesheet" href="lib/ol.css" type="text/css">
<link href="lib/font-awesome/css/font-awesome.min.css" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="css/layerManager.css">
```

Insert script tag in page body with following line :
```html
<script>
 var layer = new mapLayer();
</script>
```


# CONFIGURATION
You can configure your Layer manager with your parameters on passing a javascript object to the function.
Configuration object is divided in four parts :
- Map
- Layer manager
- Dynamic Slider for simulation
- General config

```js
{lang: 'en',
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
        layerManagerHeight: '',
        config: {
            defaultOpacity: 1,
            defaultLayerActive: true
        }
    },
    dynSlider: {
        divMapLevelAxe: "slider_elev",
        divMapTimeAxe: "slider_time",
    }
}
```

## MAP
| variable      | type    | Default value  |      Description|
| ------------- |:-------:| -----:|-------------:|
| `divMap`     | string  | 'map'|Element ID where you want map appear|
| `geoMapConfig`     | object  | `defaultBaseMap` : "OSM",`defaultXCenter` : 2,`defaultYCenter` : 48,`defaultZoomLevel` : 5||
|`defaultBaseMap`     | string  | 'OSM'|Default basemap on load|
| `defaultXCenter`     | integer  | 2|XCenter coordinate (EPSG:4326)|
| ``defaultXCenter``     | integer  | 48|YCenter coordinate (EPSG:4326)|
| `defaultZoomLevel`     | integer  | 5|Element ID where you want map appear|
| `geoserverName`     | string  | '<yourGeoServerURL>'|Geoserver url|
| `workspaceLimit`     | array  | ['<workspaceName[:workspaceDisplayName]>', '<workspaceName[:workspaceDisplayName]>']|Element ID where you want map appear|
| `keyBING`     | string  | '<yourBingKey>'|Key to use Bing Maps API|

### Exemple
Modify the Zoom level on load :
```javascript
var layer = new mapLayer({map: {
                            geoMapConfig: {
                                defaultZoomLevel: 10
                            }
                        }})  
```

## LAYER MANAGER
| variable      | type          | Default value  |   Description|
| ------------- |:-------------:| -----:|-------------:|
| `DivLayerManagerModal`     | string  | 'layerManagerModal'|Element ID to launch Map Layer modal|
| `divLayerManager`     | string  | 'layerManager'|Element ID containing the layer manager|
| `divSaveMapModal`     | string  | 'LMSaveMapModal'|Element ID to launch modal to save map|
| `height`     | integer  | ''|Height of map layer list|
| `config`     | object  | `defaultOpacity` : 1,`defaultLayerActive` : true||
| `defaultOpacity`     | float between 0 and 1  | 1 |Background map opacity|
| `defaultLayerActive`     | boolean  | true | Show/Hide background map |
### Exemple
Modify height of layer manager :
```javascript
 var layer = new mapLayer({
                            layerManager: {
                                height: 250                        
                            }
                        })  
```

## DYNAMIC SLIDER
| variable      | type          | Default value  |   Description|
| ------------- |:-------------:| -----:|-------------:|
| `dynSlider`     | obj  | `divMapLevelAxe` : 'slider_elev',`divMapTimeAxe` : 'slider_time'|Element ID to launch Map Layer modal|
| `divMapLevelAxe`     | string  | 'slider_elev'|Element ID where is Level axe|
| `divMapTimeAxe`     | string  | 'slider_time'|Element ID where is Time axe|
### Exemple
Modify Level Axe location :
```javascript
var layer = new mapLayer({dynSlider: {
                            divMapLevelAxe: 'newElement'
                        }})  
```

## GENERAL
| variable      | type          | Default value  |   Description|
| ------------- |:-------------:| -----:|-------------:|
| `lang`     | string  | 'en'|Lang of module, actually English and French are diponible|
### Exemple
Modify module lang to french :
```javascript
 var layer = new mapLayer({lang:'fr'}) 
```
*To modify lang, it depends if file messages_'lang'.js exists*


# LICENCE
LYXEA Map-layer.js is available under **Licence Apache2.0 :** https://github.com/Lyxea/map-layers.js/blob/master/LICENSE
