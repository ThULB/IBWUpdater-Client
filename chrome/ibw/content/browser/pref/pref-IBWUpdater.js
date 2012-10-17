var application = Components.classes["@oclcpica.nl/kitabapplication;1"]
					.getService(Components.interfaces.IApplication);

var _elementIDs = [
                   "TUILUpdater", 
                ];
var updaterData   = [];
var gPrefWindow         = null;
var idWindow;

function Startup()
{  
   idWindow = "pref-tuilupdate";
   try {
      gPrefWindow = window.parent.hPrefWindow;
   }
   catch (e) {
      alert( "FAIL[pref-tuilupdate.js]: could not establish link to parent\nEXEPTION: " + e );
   }
   gPrefWindow.registerOKCallbackFunc(onOK);
   return true;
}

function onOK()
{  
	alert("TUIL Updater");
   if (idWindow != "pref-tuilupdate") return;   

   try {
	   var dataObject = parent.hPrefWindow.wsm.dataManager.pageData["chrome://ibw/content/browser/pref/pref-tuilupdate.xul"].userData;
	   updaterData = dataObject.messageTypesData;
      }
      else {
         alert( "FAIL[pref-tuilupdate.js]: OK handler: no dataEls in screenObjectData" );
      }
}

function onCancel()
{
    return true;
}
