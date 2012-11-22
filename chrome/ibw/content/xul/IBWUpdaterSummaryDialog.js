/**
 * @version 1.1 - $Revision$ (beta)
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

function onLoad() {
	try {
		var packages = window.arguments[0].packages;

		var tList = document.getElementById('tPackages');
		var tChilds = tList.getElementsByTagName("treechildren").item(0);
		
		for ( var c = 0; c < packages.length; c++) {
			var pkg = packages[c];
			
			var pkgData = new Array(pkg.getName(), pkg.getDescription(), I18N.getLocalizedMessage("summary.type." + pkg.getType()), pkg.getVersion());
			tChilds.appendChild(addTreeRow(pkgData, "pkg_" + c));
		}
	} catch (ex) {
		application.messageBox("IBWUpdater", ex, "error-icon");
	}
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