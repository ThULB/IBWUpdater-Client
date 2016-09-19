/**
 * @version @@Version (@@Revision)
 * @author René Adler
 * 
 * This program is free software; you can use it, redistribute it and / or
 * modify it under the terms of the GNU General Public License (GPL) as
 * published by the Free Software Foundation; either version 3 of the License or
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

function includeJS(chromeFilePath, NameSpaceContainer) {
	var scriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
	scriptLoader.loadSubScript(chromeFilePath, NameSpaceContainer);
}

var external = {};
includeJS("resource:/chrome/ibw/lib/IBWUpdater.js", external);

// init Update on WinIBW startup - if set under setup.js
var updater = new external.IBWUpdater();
try {
	if (updater.hasUpdates()) {
		updater.start();
	}
} catch (e) {
	application.messageBox("IBWUpdater", e, "error-icon");
}