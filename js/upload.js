/**
 * ###
 * # Fonction l'upload
 */

var majNameInputFile = function(div, span, submit){
    var input = $("#"+div);
    if(input.val().length<=0){return;}
    var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    $("#" + span).text(" - " + label);
    $("#" + submit).show();
 }


/**
 * Fonction permettant de mettre à jour une progress bar
* @param {Object} progress_bar - L'objet Jquery correspondant à la progress bar 
* @param {int} max - le total à uploader (e.total)
* @param {int} current - le total actuellement chargé (e.loaded)
*/
function progress(submitId, max, current){
    var Percentage = Math.floor((current * 100)/max);
    $("#"+submitId + " span").html(trans["Uploadinprogress"] + " : " + Percentage +'%');
    if(Percentage >= 100)// process completed  
    {
        //On ne va pas désactiver tout de suite le 'active' de la progress bar parce qu'il se passe des actions côté server qui prennent du temps.    
        $("#"+submitId + " span").text(trans["ServerTreatment"]);         
    }
}
         
var uploadFile = function(div){
    $("form#"+div).submit(function(event){
        //event.preventDefault();//On stop la propagation de l'evenement
        var url = $(this).attr( "action" );
        if($("#inputfile").get(0).files.length == 0 ){//Si aucun fichier n'est selectionné, on quitte
            return;
        }
        var formData = new FormData(this);
        $(this).find(":input").each(function(){
            $(this).prop('disabled', true);
        });

        var resAjax = $.ajax({
            url: url,
            cache: false,
            contentType: false,
            processData: false,
            data: formData,                         
            type: 'post',
            headers: {
                'X-XSRF-TOKEN': $('form#upload_file_form input[name="_token"]').val()
            },
            xhr: function() {//Pour afficher la progression
                var myXhr = $.ajaxSettings.xhr();
                if(myXhr.upload){
                    myXhr.upload.addEventListener('progress',function(e){progress("sbmitUpload", e.total, e.loaded );}, false);
                }
                return myXhr;
            },
            success: function(){
                $("#sbmitUpload" + " span").text(trans["successTreatment"]);
                $("#loader-finsh-spinner").show();


                /*console.log("Upload complete");
                var filename = $("#inputfile").val().replace(/\\/g, '/').replace(/.*\//, '');
                $.when(updateMartheFileList()).done(function(){//On va coloriser le nom du fichier qui vient d'être ajouté
                    $('div[id="div_' + filename + '"]').css("background-color", "#D1AD0D");
                    $('div[id="div_' + filename + '"]').animate({
                        backgroundColor: 'transparent',
                    },1500);
                });*/
            },
            fail: function(){
                $("#loader-error-spinner").show();
                console.log( "Upload error" );
            }
        });
        resAjax.always(function() {
            console.log("FIN")
            $("#sbmitUpload span").text(trans["Uploadnewfile"]);
            $("form#upload_file_form :input").each(function(){
                $(this).prop('disabled', false);
            });
        });
    });
}
