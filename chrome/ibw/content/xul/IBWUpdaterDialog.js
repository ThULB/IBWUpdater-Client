/**
 * @version 1.0 - $Revision$ (beta)
 * @author René Adler
 * 
 * This program is free software; you can use it, redistribute it and / or
 * modify it under the terms of the GNU General Public License (GPL) as
 * published by the Free Software Foundation; either version 2 of the License or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program, in a file called gpl.txt or license.txt. If not, write to the
 * Free Software Foundation Inc., 59 Temple Place - Suite 330, Boston, MA
 * 02111-1307 USA
 */

var updater;
var wasPrevStarted = false;

function onLoad() {
	try {
		forceInstall = window.arguments[0].forceInstall;
		updater = new IBWUpdater(forceInstall);
	} catch (ex) {
		application.messageBox("IBWUpdater", ex, "error-icon");
	}
}

function onClose() {
	try {
		if (!updater.isProcessing()) {
			application.messageBox("IBWUpdater", I18N.getLocalizedMessage("packages.step.Restart"), "alert-icon");
		}
		return !updater.isProcessing();
	} catch (ex) {
		return true;
	}
	
}

function onFocus() {
	try {
		if (!updater.isProcessing() && !wasPrevStarted) {
			wasPrevStarted = true;
			startProcessing();
		}
	} catch (ex) {
		application.messageBox("IBWUpdater", ex, "error-icon");
	}
}

function startProcessing() {
	try {
		updater.processPackages(function(progress) {
			document.getElementById("lbPackageName").label = I18N.getLocalizedMessage("package.process", progress.name);
			document.getElementById("lbStep").value = progress.step;

			document.getElementById("pbSingle").value = progress.single;
			document.getElementById("lbProgressSingle").label = progress.single + "%";

			document.getElementById("pbTotal").value = progress.total;
			document.getElementById("lbProgressTotal").label = progress.total + "%";
		}, doneProcessing);
	} catch (ex) {
		application.messageBox("IBWUpdater", ex, "error-icon");
	}
}

function doneProcessing() {
	var packages = updater.getPackages();
	var cCommon = 0;
	var cUser = 0;

	for (var c=0; c < packages.length; c++) {
		if (packages[c].getType() == "common")
			cCommon++;
		else
			cUser++;
	}
	document.getElementById("pkgProgress").hidden = true;
	
	document.getElementById("lbPackageName").label = I18N.getLocalizedMessage("summary.title");
	document.getElementById("processingDone").hidden = false;
	
	var desc = I18N.getLocalizedMessage("summary.installedTotal" + (packages.length == 1 ? "One" : ""), packages.length);
	
	if (cCommon != 0 && cUser != 0)
		desc += I18N.getLocalizedMessage("summary.installedCommon"+ (cCommon == 1 ? "One" : "") + "AndUser" + (cUser == 1 ? "One" : ""), cCommon, cUser);
	else if (cCommon > 1)
		desc += I18N.getLocalizedMessage("summary.installedCommon", cCommon);
	else if (cUser > 1)
		desc += I18N.getLocalizedMessage("summary.installedUser", cUser);
	else
		desc += ".";
	
	document.getElementById("descSummary").textContent = desc;
	
	window.sizeToContent();
}

function openSummary() {
	var packages = updater.getPackages();
	window.openDialog("chrome://ibw/content/xul/IBWUpdaterSummaryDialog.xul", "Summary", "centerscreen,modal,resizable", {"packages": packages});
}