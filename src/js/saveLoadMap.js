
var saveLoadMap = function(modalDiv, mapArray, route, token){
    var self = this;
    
    var route = route;
    var modalDiv = modalDiv;
    var mapArray = mapArray;
    var token = token;
    var jquerySaveDiv = $("#"+modalDiv).append("<div id='saveModal'></div>").find("#saveModal");
    var jqueryLoadDiv = $("#"+modalDiv).append("<div id='loadModal'></div>").find("#loadModal");
	var LayerMangerLoadFunction;
    /**
     * Initialize the modal
     */
    this.init = function(){
        jquerySaveDiv.append(addSaveModal());
        jqueryLoadDiv.append(addLoadModal());
        
        $.each(mapArray, function(index, item){
            jqueryLoadDiv.find("#listMap").append('<option value="' + item.id + '">' + item.mapname + '</option>');
        });
		
		jquerySaveDiv.find('#modalSaveMap').find("#btn-save-map").click(function(){
			var mapName = jquerySaveDiv.find('#modalSaveMap').find("#nameMapSave").val();
			var jsonMap = jquerySaveDiv.find('#modalSaveMap').find("#jsonMapSave").val();
			download(mapName + ".json", jsonMap);
			jquerySaveDiv.find('#modalSaveMap').modal('hide');
			jquerySaveDiv.find('#formJsonMapSave')[0].reset();
		});
		
		jqueryLoadDiv.find('#modalLoadMap').find("#btn-load-map").click(function(){
			loadFile(LayerMangerLoadFunction);
			jqueryLoadDiv.find('#loadJsonFile')[0].reset();
		})
    }

    /**
     * Saving a card
     */
    this.openSaveMapModal = function(jsonMap){
        jquerySaveDiv.find('#modalSaveMap').modal('show');
        jquerySaveDiv.find('#modalSaveMap').find("#jsonMapSave").val(jsonMap);
    };
	
	var download = function(filename, text) {
		var pom = document.createElement('a');
		pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		pom.setAttribute('download', filename);
		if (document.createEvent) {
			var event = document.createEvent('MouseEvents');
			event.initEvent('click', true, true);
			pom.dispatchEvent(event);
		}
		else {
			pom.click();
		}
	}
	

    /**
     * Loading a map
     */
    this.openLoadMapModal = function(loadMap){
		LayerMangerLoadFunction = loadMap;
        jqueryLoadDiv.find('#modalLoadMap').modal('show');
    }
	
	var loadFile = function(loadMap) {
		var input, file, fr;

        if(typeof window.FileReader !== 'function') {
            alert(trans["apiNotSupported"]);            
            return;
        }

        input = document.getElementById('files');
        if (!input) {
            
        }
        else if (!input.files) {
            alert(trans["browserNotSupported"]);
        }
        else if (!input.files[0]) {
            alert(trans["errorSelectFile"]);
        }
		else {
		  file = input.files[0];
		  fr = new FileReader();
		  
		  fr.onload = receivedText;
		  fr.readAsText(file);
		}

		function receivedText(e) {
		  lines = e.target.result; 
		  loadMap(lines);
		}
	}
	
    /**
     * The general code of the modal Save
     */
    var addSaveModal = function(){
        var div = '<div class="modal fade" id="modalSaveMap" role="dialog" aria-labelledby="myModalSaveLabel" aria-hidden="true"> \
        <div class="modal-dialog"> \
            <div class="modal-content"> \
                <form id="formJsonMapSave" role="form" method="POST" action="' + route + '"> \
                    <div class="modal-header"> \
                        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">×</span><span class="sr-only">'+ trans["close"] +'</span></button> \
                        <h4 class="modal-title" id="myModalSaveLabel">'+ trans["saveMap"] +'</h4> \
                    </div> \
                    <div class="modal-body"> \
                        <input type="text" name="nameMapSave" id="nameMapSave" class="form-control" maxlength="200" />  \
                        <input type="hidden" name="jsonMapSave" id="jsonMapSave" class="form-control" /> \
                        <input type="hidden" name="statusSave" id="statusSave" class="form-control" value="public"/>  \
                        <input type="hidden" name="idCurrentSave" id="idCurrentSave" class="form-control" value="1"/>  \
                        <input type="hidden" name="_token" value="' + token + '">\
                    </div> \
                    <div class="modal-footer"> \
                        <button type="button" class="btn btn-default pull-left" data-dismiss="modal">'+ trans["cancel"] +'</button> \
                        <button type="button" id="btn-save-map" class="btn btn-primary pull-right">'+ trans["save"]+'</button> \
                    </div> \
                </form> \
            </div> \
        </div> \
    </div>';
        return div;
    }

    /**
     * The general code of the modal Load
     */
    var addLoadModal = function(){
        var div = '<div class="modal fade" id="modalLoadMap" role="dialog" aria-labelledby="myModalLoadLabel" aria-hidden="true"> \
        <div class="modal-dialog"> \
            <div class="modal-content"> \
				<form id="loadJsonFile" name="jsonFile" enctype="multipart/form-data" method="post"> \
					<div class="modal-header"> \
						<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">×</span><span class="sr-only">'+ trans["close"] +'</span></button> \
						<h4 class="modal-title" id="myModalLoadLabel">'+ trans["loadMap"] +'</h4> \
					</div> \
					<div class="modal-body"> \
							<input type="file" id="files" name="file" /> \
					</div> \
					<div class="modal-footer"> \
						<button type="button" class="btn btn-default pull-left" data-dismiss="modal">'+ trans["cancel"] +'</button> \
						<button type="button" id="btn-load-map" data-dismiss="modal" class="btn btn-primary pull-right">'+ trans["load"] +'</button> \
					</div> \
				</form> \
            </div> \
        </div> \
    </div>';
        return div;
    }


    /**
     * END OF saveMap Object
     */

}