/**
 * $Revision$ $Date$
 * @author René Adler
 *
 * This program is free software; you can use it, redistribute it
 * and / or modify it under the terms of the GNU General Public License
 * (GPL) as published by the Free Software Foundation; either version 2
 * of the License or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program, in a file called gpl.txt or license.txt.
 * If not, write to the Free Software Foundation Inc.,
 * 59 Temple Place - Suite 330, Boston, MA  02111-1307 USA
 */
var application = Components.classes["@oclcpica.nl/kitabapplication;1"].getService(Components.interfaces.IApplication);

var _elementIDs = [ "IBWUpdater" ];
var updaterData = [];
var gPrefWindow = null;
var idWindow;

var pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
var iMode = Components.interfaces.nsISupportsString;

function Startup() {
	idWindow = "pref-IBWUpdater";
	try {
		gPrefWindow = window.parent.hPrefWindow;
	} catch (e) {
		alert("FAIL[pref-IBWUpdater.js]: could not establish link to parent\nEXEPTION: " + e);
	}
	
	gPrefWindow.registerOKCallbackFunc(onOK);
	getUpdateSourceLocation();
	
	showInstalled();
	
	return true;
}

function onOK() {
	if (idWindow != "pref-IBWUpdater")
		return;

	try {
		var dataObject = parent.hPrefWindow.wsm.dataManager.pageData["chrome://ibw/content/browser/pref/pref-IBWUpdater.xul"].userData;
		updaterData = dataObject.updaterData;

		if ("dataEls" in updaterData) {
			var uRLUpdateSourceLocation = updaterData.dataEls.uRLUpdateSourceLocation;

			try {
				gPrefWindow.pref.SetUnicharPref("IBWUpdater.url", uRLUpdateSourceLocation);
			} catch (e) {
				alert("FAIL[pref-IBWUpdater.js]: cannot write general preferences to disk\nEXEPTION: " + e);
			}
		} else {
			alert("FAIL[pref-IBWUpdater.js]: OK handler: no dataEls in updaterData");
		}
	} catch (e) {
		alert("FAIL[pref-IBWUpdater.js]: OK handler: no dataEls in screenObjectData");
	}
}

function onCancel() {
	return true;
}

function GetFields() {
	try {
		var dataObject = {};

		// save data in the parent window
		dataObject.updaterData = updaterData;
		return dataObject;
	} catch (e) {
		alert("FAIL: cannot retrieve data for file locations\nEXEPTION: " + e);
	}
}

function SetFields(aDataObject) {
	updaterData = "updaterData" in aDataObject ? aDataObject.updaterData : updaterData;

	if (!("dataEls" in updaterData)) {
		updaterData = fetchFields(updaterData);
	}
}

function fetchFields(aDataObject) {
	var uRLUpdateSourceLocation = null;

	try {
		uRLUpdateSourceLocation = pref.getComplexValue("IBWUpdater.url", iMode).data;
	} catch (e) {
		// set default value
		uRLUpdateSourceLocation = "http://service.bibliothek.tu-ilmenau.de/ibwupd/";
	}

	aDataObject.dataEls = new Object;
	aDataObject.dataEls.uRLUpdateSourceLocation = uRLUpdateSourceLocation;

	return aDataObject;

}

function getUpdateSourceLocation() {
	document.getElementById("idUpdateSourceLocation").value = updaterData.dataEls.uRLUpdateSourceLocation;
}

function setUpdateSourceLocation(value) {
	gPrefWindow.pref.SetUnicharPref("IBWUpdater.url", value);
}

function showInstalled() {
	var updater = new IBWUpdater();
	
	var lbVersion = document.getElementById('lbVersion');
	lbVersion.value += updater.getVersion();
	
	var packages = updater.getInstalledPackages();
	
	var tList = document.getElementById('tPackages');
	var tChilds = tList.getElementsByTagName("treechildren").item(0);
	
	for ( var c = 0; c < packages.length; c++) {
		var pkg = packages[c];
		
		var pkgData = new Array(pkg.getName(), pkg.getDescription(), I18N.getLocalizedMessage("summary.type." + pkg.getType()), pkg.getVersion());
		tChilds.appendChild(addTreeRow(pkgData, "pkg_" + c));
	}
}

function startForcedInstall() {
	window.openDialog("chrome://ibw/content/xul/IBWUpdaterDialog.xul", "", "chrome,dialog=yes,centerscreen", {forceInstall: true});
}

function addTreeRow(items, id) {
	var treeitem = document.createElement('treeitem');
	treeitem.setAttribute('id', id);

	var treerow = document.createElement('treerow');
	
	if (typeof items == "string") {
		var cell = document.createElement('treecell');
		cell.setAttribute('label', items);
		treerow.appendChild(cell);
	} else if (typeof items == "array" || typeof items == "object") {
		for ( var c = 0; c < items.length; c++) {
			var cell = document.createElement('treecell');
			cell.setAttribute('label', items[c]);
			treerow.appendChild(cell);
		}
	}
	
	treeitem.appendChild(treerow);
	
	return treeitem;
}