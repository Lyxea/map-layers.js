
var jsonWriter = function(cookiesMapName){

    var self = this;
    var jsonVersion = "1.0";
    var jsonObj = {};
    var cookiesKeyActualMap = cookiesMapName;

    /************************
     * GENERAL
     */

    /**
     * Retourne l'objet JSON
     */
    this.getJsonObj = function(){
        return jsonObj;
    }

    /**
     * Retourne le JSON sous forme de String
     */
    this.getJsonString = function(){
        return JSON.stringify(jsonObj);
    }

    /**
     * Permet de lire un cookie
     * @param {String} name - nom du cookie
     */
    var readCookie = function(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }

    /**
     * Permet de retourner le cookie correspondant à la config du layermanager
     */
    this.readMapCookie = function(){
        return readCookie(cookiesKeyActualMap);
    }


    /**
     * Permet de supprimer le cookie coorespondant à la config du layerManager afin de recommencer un carte vide au besoin
     */
    this.clearMapCookie = function(){
        $.removeCookie(cookiesKeyActualMap);
    }

    /**
     * permet d'écrir/écraser le cookie correspondant à la config du layermanager
     * (a appeler après toutes modification !)
     */
    this.writeConfigCookies = function(){
        self.setMapName(cookiesKeyActualMap);
        var expiration_date = new Date();
        var cookie_string = '';
        expiration_date.setFullYear(expiration_date.getFullYear() + 1);
        cookie_string = cookiesKeyActualMap + "=" + self.getJsonString() + "; expires=" + expiration_date.toUTCString();;
        document.cookie = cookie_string;
    }

    this.setIdMap = function(id){
        jsonObj.mapID = id
    }

    this.setMapName = function(mapName){
        jsonObj.mapName = mapName
    }

    /**
     * SETTER
     * Les fonctions suivantes permettent de mettre à jour l'objet JSON
     * Elles mettent automatiquement le cookie à jour
     */

    /**
     * Ecrit l'URL du GeoServer
     * @param {String} geoserver - L'URL du geoserver
     */
    this.geoServer = function(geoserver){
        jsonObj.geoserver = geoserver.toString();
        self.writeConfigCookies();
    }

    /**
     * Ecrit le nom du créateur de la carte
     * @param {String} ownerName - Le créateur de la carte
     */
    this.ownerName = function(ownerName){
        jsonObj.ownerName = ownerName.toString();
        self.writeConfigCookies();
    }

    /**
     * Ecrit le nom de la personne qui a modifié la carte 
     * @param {String} userName - Nom du propriétaire de la carte
     */
    this.userName = function(userName){
        jsonObj.userName = userName.toString();
        self.writeConfigCookies();
    }

    /**
     * Ecrit la date de création de la carte
     * //TODO : Ne devrait jamais être appeler par l'utilisateur
     * @param {String} creationDate - Date de création de la carte
     */
    var creationDate = function(creationDate){
        jsonObj.creationDate = creationDate.toString();
        self.writeConfigCookies();
    }

    /**
     * Ecrit la date de dernière modification de la carte
     * @param {String} lastModificationDate - Date de dernière modification de la carte
     */
    this.lastModificationDate = function(lastModificationDate){
        jsonObj.lastModificationDate = lastModificationDate.toString();
        self.writeConfigCookies();
    }

    /**
     * Ecrit le nom de la carte
     * @param {String} mapName - Nom de la carte
     */
    this.mapName = function(mapName){
        jsonObj.mapName = mapName.toString();
        self.writeConfigCookies();
    }

    /**
     * Ecrit le titre de la carte
     * @param {String} mapTitle - Titre de la carte
     */
    this.mapTitle = function(mapTitle){
        jsonObj.mapTitle = mapTitle.toString();
        self.writeConfigCookies();
    }

    /**
     * Ecrit l'identifiant unique de la carte. Doit correspondre avec l'ID de la carte en base
     * @param {int} mapID - Identifiant de la carte
     */
    this.mapID = function(mapID){
        jsonObj.mapID = mapID.toString();
        self.writeConfigCookies();
    }

    /**
     * Ecrit le status de partage de la carte
     * ublic (Read), private (seulement le userName), share (Read - liste personne; R/W - liste personne)
     * @param {String} shareStatus - Status de partage de la carte
     */
    this.shareStatus = function(shareStatus){
        jsonObj.shareStatus = shareStatus.toString();
        self.writeConfigCookies();
    }

    
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
    this.newLayer = function(layerId, layerName, layerDisplayName, layerGroupName, layerOrderInGroup, active, visibility, opacity){
        //Si c'est le premier layer, on initialise la liste
        if(jsonObj.layers === undefined){
            jsonObj.layers = [];
        }
        layerId = parseInt(layerId)
        //Si le layer existe déjà, on le retourne, on ne l'écrase pas.
        //Pour ecraser un layer, on passera par le setter de celui ci
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;});
        if(indexLayer > -1){
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
    }

    /**
     * Met à jour le nom affiché du layer
     * @param {int} layerId - id du layer
     * @param {string} newLayerDisplayName - Nom affiché du layer
     */
    this.setlayerDisplayName = function(layerId, newLayerDisplayName){
        layerId = parseInt(layerId)
        //Si aucun layer n'est présent
        if(jsonObj.layers === undefined || (jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;})<= -1) ){return undefined;}
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;});
        jsonObj.layers[indexLayer].layerDisplayName = newLayerDisplayName;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];
    }

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
    this.setLayerOrderInGroup = function(layerId, newLayerOrderInGroup){
        layerId = parseInt(layerId)
        //Si aucun layer n'est présent
        if(jsonObj.layers === undefined || (jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;})<= -1) ){return undefined;}
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;});
        jsonObj.layers[indexLayer].layerOrderInGroup = newLayerOrderInGroup;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];        
    }

    this.setOpacity = function(layerId, newOpacity){
        layerId = parseInt(layerId)
        //Si aucun layer n'est présent
        if(jsonObj.layers === undefined || (jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;})<= -1) ){return undefined;}
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;});
        jsonObj.layers[indexLayer].opacity = newOpacity;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];        
    }

    /**
     * Met à jour le layer active/inactif
     * @param {int} layerId - ID du layer
     * @param {bool} newActive - Si le layer est activé
     */
    this.setActive = function(layerId, newActive){
        layerId = parseInt(layerId)
        //Si aucun layer n'est présent
        if(jsonObj.layers === undefined || (jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;})<= -1) ){return undefined;}
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;});
        jsonObj.layers[indexLayer].active = newActive;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];        
    }

    /**
     * Met à jour la visibilité du layer
     * @param {int} layerId - ID du layer
     * @param {bool} newVisibility - Visibilité du layer
     */
    this.setVisibility = function(layerId, newVisibility){
        layerId = parseInt(layerId)
        //Si aucun layer n'est présent
        if(jsonObj.layers === undefined || (jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;})<= -1) ){return undefined;}
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;});
        jsonObj.layers[indexLayer].visibility = newVisibility;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];        
    }


    /**
     * Met à jour l'opacité du layer
     * @param {int} layerId - ID du layer
     * @param {float} newOpacity - Opacité du layer
     */
    this.setOpacity = function(layerId, newOpacity){
        layerId = parseInt(layerId)
        //Si aucun layer n'est présent
        if(jsonObj.layers === undefined || (jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;})<= -1) ){return undefined;}
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;});
        jsonObj.layers[indexLayer].opacity = newOpacity;
        self.writeConfigCookies();
        return jsonObj.layers[indexLayer];        
    }

    this.setExtent = function(extent, epsg){
        jsonObj.extent = extent;
        jsonObj.extentEPSG = epsg;
        self.writeConfigCookies();
    }

    this.setZoom = function(newZoom){
        jsonObj.zoom = newZoom;
    }

    /**
     * 
     * @param {*} layerId 
     */
    this.removeLayer = function(layerId){
        layerId = parseInt(layerId)
        //Si aucun layer n'est présent
        if(jsonObj.layers === undefined || (jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;})<= -1) ){return undefined;}
        var indexLayer = jsonObj.layers.findIndex(function findIndex(l){return l.layerId === layerId;});
        jsonObj.layers.splice(indexLayer,1);
        self.writeConfigCookies();
        //delete jsonObj.layers[indexLayer];

    }

    this.forceRemoveAllLayer = function(){
        jsonObj.layers = [];
        self.writeConfigCookies();
    }




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
    this.newLayerGroup = function(groupName, groupDisplayName, groupOrder, groupActive, groupVisibility){
        //Si c'est le premier layerGroup, on initialise la liste
        if(jsonObj.layerGroups === undefined){
            jsonObj.layerGroups = [];
        }

        //Si le group existe déjà, on le retourne, on ne l'écrase pas.
        //Pour ecraser un group, on passera par le setter de celui ci
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;});
        if(indexGroup > -1){
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
    }
    
    this.setGroupDisplayName = function(groupName, newGroupDisplayName){
        //Si aucun layer n'est présent
        if(jsonObj.layerGroups === undefined || (jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;})<= -1) ){return undefined;}
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;});
        jsonObj.layerGroups[indexGroup].groupDisplayName = newGroupDisplayName;
        self.writeConfigCookies();
        return jsonObj.layerGroups[indexGroup];        
    }
    this.setGroupOrder = function(groupName, newGroupOrder){
        //Si aucun layer n'est présent
        if(jsonObj.layerGroups === undefined || (jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;})<= -1) ){return undefined;}
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;});
        jsonObj.layerGroups[indexGroup].groupOrder = newGroupOrder;
        self.writeConfigCookies();
        return jsonObj.layerGroups[indexGroup];        
    }
    this.setGroupActive = function(groupName, newGroupActive){
        //Si aucun layer n'est présent
        if(jsonObj.layerGroups === undefined || (jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;})<= -1) ){return undefined;}
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;});
        jsonObj.layerGroups[indexGroup].groupActive = newGroupActive;
        self.writeConfigCookies();
        return jsonObj.layerGroups[indexGroup];        
    }
    this.setGroupVisibility = function(groupName, newGroupVisibility){
        //Si aucun layer n'est présent
        if(jsonObj.layerGroups === undefined || (jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;})<= -1) ){return undefined;}
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;});
        jsonObj.layerGroups[indexGroup].groupVisibility = newGroupVisibility;
        self.writeConfigCookies();
        return jsonObj.layerGroups[indexGroup];
    }

    /**
     * Met à jour le group ouvert/replié
     * @param {int} groupName - ID du layer
     * @param {bool} minimize - Si le layer est activé
     */
    this.setMinmizeGroupe = function(groupName, minimize){
        //Si aucun group n'est présent
        if(jsonObj.layerGroups === undefined || (jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;})<= -1) ){return undefined;}
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;});
        jsonObj.layerGroups[indexGroup].minimize = minimize;
        self.writeConfigCookies();
        return jsonObj.layerGroups[indexGroup];
    }

    this.setActiveGroup = function(groupName, active){
        //Si aucun group n'est présent
        if(jsonObj.layerGroups === undefined || (jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;})<= -1) ){return undefined;}
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;});
        jsonObj.layerGroups[indexGroup].groupActive = active;
        self.writeConfigCookies();
        return jsonObj.layerGroups[indexGroup];
    }

    /**
     * 
     * @param {*} groupName 
     */
    this.removeGroup = function(groupName){
        //Si aucun group n'est présent
        if(jsonObj.layerGroups === undefined || (jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;})<= -1) ){return undefined;}
        var indexGroup = jsonObj.layerGroups.findIndex(function findIndex(l){return l.groupName === groupName;});
        jsonObj.layerGroups.splice(indexGroup,1);
        self.writeConfigCookies();
        //delete jsonObj.layers[indexLayer];
    }

    this.forceRemoveAllGroup = function(){
        jsonObj.layerGroups = [];
        self.writeConfigCookies();
    }


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
    this.newBaseMap = function(baseMapName, opacity, active){
        
        //Si le baseMap existe déjà, on le retourne, on ne l'écrase pas.
        //Pour ecraser un baseMap, on passera par le setter de celui ci
        if(jsonObj.baseMap !== undefined){
            return jsonObj.baseMap;
        }
        jsonObj.baseMap = {};
        jsonObj.baseMap.baseMapName = baseMapName;
        jsonObj.baseMap.opacity = opacity;
        jsonObj.baseMap.active = active;
        self.writeConfigCookies();
        return jsonObj.baseMap;
    }

    /**
     * Met à jour le nom / la source du base map
     * @param {String} newBaseMapName - Nom du baseMap
     */
    this.setBaseMapName = function(newBaseMapName){
        if(jsonObj.baseMap === undefined){return undefined;}

        jsonObj.baseMap.baseMapName = newBaseMapName;
        self.writeConfigCookies();
        return jsonObj.baseMap; 
    }

    /**
     * Met à jour l'opacité du baseMap
     * @param {float} newOpacity - Opacité du baseMap
     */
    this.setBaseMapOpacity = function(newOpacity){
        if(jsonObj.baseMap === undefined){return undefined;}

        jsonObj.baseMap.opacity = newOpacity;
        self.writeConfigCookies();
        return jsonObj.baseMap; 
    }

    /**
     * Met à jour le baseMap actif/inactif
     * @param {bool} newActive - true si le baseMap doit être actif
     */
    this.setBaseMapActive = function(newActive){
        if(jsonObj.baseMap === undefined){return undefined;}

        jsonObj.baseMap.active = newActive;
        self.writeConfigCookies();
        return jsonObj.baseMap; 
    }

    /************************
     * GENERAL
     */


    

    /**
     * END OF jsonWriter Object
     */
}