var library = function(modalDiv, geoserverURL,  workspaceLimit){
    var self = this;
    this.modalDiv = modalDiv;
    var jqueryModalDiv = $("#" + modalDiv);
    this.workspaceLimit = workspaceLimit;
    var geoserverURL = geoserverURL;

    var layerCapabilities = {};

    /**
     * Permet de créer la modal contenant tous les layers disponibles
     */
    this.createModalListLayer = function(){
		//we create the modal
        var modalDiv = addModal();
        jqueryModalDiv.append(modalDiv)
        //When we edit the name of the group and the user clicks on "Enter", we validate
        jqueryModalDiv.find("#groupName").on('keypress', function(e) {
            if (e.keyCode === 13) {
                jqueryModalDiv.find("#add_layers").trigger( "click" );
            }
        });
        //For all layers, we will recover their capabilities, create the list of available layers for the library and store them
        var parser = new ol.format.WMSCapabilities();
        $.each(self.workspaceLimit, function(index, workspaceNameAndDisplay){
            var workspaceSplit = workspaceNameAndDisplay.split(":");
            var workspaceName = workspaceSplit[0];
            var workspaceNameDisplay = workspaceName;
            if(workspaceSplit.length>1){
                workspaceSplit.shift(); //I delete the first elemnet (the name of the workspace) and I join with the seprator (if ever the name to display contains ':')
                workspaceNameDisplay = workspaceSplit.join(":");
            }
            var urlGetCap = geoserverURL +  "geoserver/" +workspaceName + "/wms?service=wms&version=1.3.0&request=GetCapabilities";
            $.ajax(urlGetCap).done(function(res) {
                getCapabilitiesLib = parser.read(res);
                if(getCapabilitiesLib.Capability.Layer.Layer == undefined){
                    console.log("Error with cap-worksapce : " + workspaceName)
                    return;
                }
                var wsDiv = modalCreateWorkspace(workspaceName, workspaceNameDisplay , getCapabilitiesLib.Capability.Layer.Layer.length);
                jqueryModalDiv.find(".modal-body").append(wsDiv)
                workspaceChangeCollapsed(workspaceName);
                allLayer = getCapabilitiesLib.Capability.Layer.Layer;
                $.each(allLayer, function(index, item){
                    var layerName = item.Name;
                    var layerTitle = item.Title;
                    var newLay = modalCreateLayer(workspaceName, layerName, layerTitle);
                    layerCapabilities[workspaceName+":"+layerName] = item
                    jqueryModalDiv.find(".modal-body").find("#"+workspaceName).find(".list-layers").append(newLay);
                });
                addSelectWorkspaceEvent(jqueryModalDiv.find(".modal-body").find("#"+workspaceName));
                self.sortDivWorkspace();
                
                
            })
            .fail(function() {
                console.log( "Faild to load workspace : \t" +workspaceName);
            });
        });
        
    }

    /**
     * Returns the capabilities of a layer
     * @param {String} layerName - Layer name (ws: layername)
     */
    this.getLayerCapabilities = function(layerName){
        return layerCapabilities[layerName];
    }

    /**
     * Open the modal manually (function used by the layerManager)
     */
    this.openLibrary = function(){
        jqueryModalDiv.find('#modalAddLayer').modal('show');
    }

    /**
     * Allows to manage the addition of the layers (called when the valid user is choice of layer)
     * @param {function} callback - function that will be called with an object key parameter: layername value: capabilities of the layer (the LayerManager sends its function to change the layers on its side)
     */
    this.addLayers = function(callback){
        jqueryModalDiv.find("#add_layers").click(function(){
            //var listLayers = {};
            var listLayers = [];
            var cpt = 0;
            jqueryModalDiv.find("#modalAddLayer #layer input[type='checkbox']").each(function(){
                if ($(this).is(":checked")) {
                    cpt = cpt + 1;
                    layer = $(this).closest("#layer").data("layer")
                    workspace = $(this).closest("#layer").data("workspace")
                    //listLayers[workspace +":" + layer] = layerCapabilities[workspace +":" + layer];
                    listLayers.push(workspace +":" + layer)
                }
            });
            var groupName = jqueryModalDiv.find("#modalAddLayer .modal-footer .group-name #groupName").val();
            callback(listLayers, groupName);
            jqueryModalDiv.find('#modalAddLayer').modal('hide');
            jqueryModalDiv.find("#modalAddLayer input[type='checkbox']").each(function(){
                if ($(this).is(":checked")) {
                    $(this).prop("checked", false);
                }
            });
            jqueryModalDiv.find("#modalAddLayer .panel-collapse").each(function(){ 
                $(this).collapse('hide');
            });
        })
    }


    /**
     * The general code of the modal of the library
     */
    var addModal = function(){
        var div = '<div class="modal fade" id="modalAddLayer" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true"> \
        <div class="modal-dialog"> \
            <div class="modal-content"> \
                <div class="modal-header"> \
                    <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">×</span><span class="sr-only">Close</span></button> \
                    <h4 class="modal-title" id="myModalLabel">' + trans['layerLibrary'] + '</h4> \
                </div> \
                <div class="modal-body"> \
                </div> \
                <div class="modal-footer"> \
                    <div class="input-group group-name"> \
                        <span class="input-group-addon">' + trans['newGroupName'] + '</span> \
                        <input id="groupName" type="text" class="form-control" name="msg" placeholder="' + trans['standardGroupName'] + '"> \
                    </div> \
                    <button type="button" class="btn btn-default cancel" data-dismiss="modal">' + trans['cancel'] + '</button> \
                    <button type="button" class="btn btn-primary" id="add_layers">' + trans['loadLayers'] + '</button> \
                </div> \
            </div> \
        </div> \
    </div>';
        return div;

    }

    /**
     * Code to create a panel-group for each workspace
     * @param {String} workspaceName - Technical name of workspace
     * @param {String} workspaceNameDisplay - Name of the worksapce to display (configured in the conf file)
     * @param {int} nbLayers - Number of layer available within this workspace
     */
    var modalCreateWorkspace = function(workspaceName, workspaceNameDisplay, nbLayers){
      var ws = '<div class="panel-group" id="' + workspaceName + '" data-display-name="' + workspaceNameDisplay  +  '"> \
      <div class="panel panel-primary"> \
        <div class="panel-heading bgColor2Darker"> \
          <h4 class="panel-title"> \
            <input type="checkbox" id="selectWorkspaceLayers"> \
            <span data-toggle="collapse" class="workspace-link" href="#collapse_' + self.modalDiv + workspaceName + '"> \
                <b>' + workspaceNameDisplay + '</b> \
                <span class="left-separator borderColor2"></span> \
                <span class="label label-default bgColor2">' + nbLayers + '</span>\
                <i class="fa fa-map-o layer-icon" aria-hidden="true"></i> \
                <i class="fa fa-plus open-workspace"></i>\
            </span> \
          </h4> \
        </div> \
        <div id="collapse_' + self.modalDiv + workspaceName + '" class="panel-collapse collapse"> \
          <ul class="list-group list-layers"> \
          </ul> \
          <div class="panel-footer"></div> \
        </div> \
      </div> \
    </div>';
      return ws;
    }

    var workspaceChangeCollapsed = function(idPanel){
        jqueryModalDiv.find("#collapse_" + self.modalDiv + idPanel).on('shown.bs.collapse', function () {
            jqueryModalDiv.find(".panel-group#" + idPanel + " .workspace-link .open-workspace").removeClass("fa-plus").addClass("fa-minus");
         });
         
         
         jqueryModalDiv.find("#collapse_" + self.modalDiv + idPanel).on('hidden.bs.collapse', function () {
            jqueryModalDiv.find(".panel-group#" + idPanel + " .workspace-link .open-workspace").removeClass("fa-minus").addClass("fa-plus");
         });
    }

    /**
     * Lets you create a layer for integration into the panel-group of the workspace
     * @param {String} workspaceName - Nom du workspace
     * @param {String} layerName - Name of the layer
     * @param {String} layerTitle - Title of the layer
     */
    var modalCreateLayer = function(workspaceName, layerName, layerTitle){
        if(layerTitle == "" || layerTitle == undefined){layerTitle = layerName;}
        var lay = '<li class="list-group-item" id="layer" data-layer="' + layerName +'" data-workspace="' + workspaceName + '"> \
        <label for="' + layerName + '">  \
            <input type="checkbox" id="' + layerName + '"> \
            <div class="layer-description"> \
                <i class="fa fa-map-o layer-icon" aria-hidden="true"></i> \
                <strong>' + layerTitle + '</strong><br/>' + layerName + '\
            </div>\
        </label>\
        </li>';
        return lay;
    }

    /**
     * When the user clicks on the input of a workspace, one activates / deactivates all the layers of this workspace
     * @param {jqueryDiv} wsDiv -Jquery object from workspace
     */
    var addSelectWorkspaceEvent = function(wsDiv){
        wsDiv.find("#selectWorkspaceLayers").click(function(){
            var ws_checked = $(this).prop("checked");
            $(this).parent().parent().parent().find(".list-layers").find("input").each(function(){
                $(this).prop("checked", ws_checked);
            })
        })
    }

   

    /**
     * Sort the workspace div in the library in alphabetical order
     */
    this.sortDivWorkspace = function(){
        jqueryModalDiv.find(".panel-group").sort(function(a, b){
            return $(a).attr("data-display-name")<$(b).attr("data-display-name");
        }).each(function(){
            jqueryModalDiv.find(".modal-body").prepend(this);
        });
    }



}