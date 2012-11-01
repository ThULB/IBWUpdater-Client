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

var application = Components.classes["@oclcpica.nl/kitabapplication;1"].getService(Components.interfaces.IApplication);
/*
 * https://developer.mozilla.org/en-US/docs/Code_snippets/Miscellaneous
 * http://mb.eschew.org/16
 */

var I18N = {
    _bundle : Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle(
            "chrome://ibw/locale/IBWUpdater.properties"),

    /**
	 * Returns the localized Message from given String.
	 * 
	 * @function {public String} ?
	 * @param {String}
	 *            msg
	 * @param {Object..}
	 *            args
	 * @return The localized String.
	 */
    getLocalizedMessage : function(msg, args) {
	    try {
		    if (args) {
			    args = Array.prototype.slice.call(arguments, 1);
			    return this._bundle.formatStringFromName(msg, args, args.length);
		    } else {
			    return this._bundle.GetStringFromName(msg);
		    }
	    } catch (ex) {
		    return "???" + msg + "???";
	    }
    }
};

var IBWUpdaterHelper = {
	/**
	 * Converts an given Sting to UTF-8.
	 */
    toUnicode : function(str) {
	    try {
		    var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
		            .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
		    converter.charset = "utf-8";
		    return converter.ConvertFromUnicode(str);
	    } catch (ex) {
		    return str;
	    }
    },

    /**
	 * Reads an XML from URL or File.
	 * 
	 * @param {nsIFile|String}
	 *            aFile - the nsIFile or URL string
	 * @param {String}
	 *            aEncoding - the encoding of XML
	 * @param {Boolean}
	 *            aBypassCache - if cache should be bypassed
	 */
    readXML : function(aFile, aEncoding, aBypassCache) {
	    try {
		    var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		    var channel = null;
		    
		    if (typeof (aFile) == "string") {
			    channel = ioService.newChannel(aFile, aEncoding != undefined ? aEncoding : "UTF-8", null);
			    if (aBypassCache == true)
				    channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;
		    } else
			    channel = ioService.newChannelFromURI(ioService.newFileURI(aFile));

		    if (channel != null) {
			    var loader = Components.classes["@mozilla.org/content/syncload-dom-service;1"].getService(Components.interfaces.nsISyncLoadDOMService);
			    var doc = loader.loadDocument(channel, null);
			    return doc;
		    } else
			    return null;
	    } catch (ex) {
		    return null;
	    }
    },

    /**
	 * Reads an local file.
	 * 
	 * @param {nsIFile}
	 *            aFile - the file to read
	 * @param {String}
	 *            aLineSeparator - the line separator that should be used to
	 *            joins lines.
	 */
    readFile : function(aFile, aLineSeparator) {
	    try {
		    var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
		    istream.init(aFile, 0x01, 0444, 0);
		    istream.QueryInterface(Components.interfaces.nsILineInputStream);

		    var line = {}, lines = [], hasmore;
		    do {
			    hasmore = istream.readLine(line);
			    lines.push(line.value);
		    } while (hasmore);

		    istream.close();

		    return lines.join(aLineSeparator == null ? "\n" : aLineSeparator);
	    } catch (ex) {
		    return null;
	    }
    },

    /**
	 * Writes an local file.
	 * 
	 * @param {nsIFile}
	 *            aFile - the file to write
	 * @param {String}
	 *            aData - the data to write
	 * @param {Integer}
	 *            aFileMode - the file mode for file
	 */
    writeFile : function(aFile, aData, aFileMode) {
	    try {
		    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
		    foStream.init(aFile, aFileMode == null || aFileMode == undefined ? 0x2A : aFileMode, 00666, 0);

		    foStream.write(aData, aData.length);
		    foStream.close();
	    } catch (ex) {
		    return false;
	    }

	    return true;
    },

    /**
	 * Get the directory for given property.
	 * 
	 * @param {String}
	 *            aPropName - the property name
	 * @param {Object}
	 *            aInterface - the nsIFile interface
	 */
    getSpecialDir : function(aPropName, aInterface) {
	    try {
		    var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get(aPropName,
		            aInterface != undefined ? aInterface : Components.interfaces.nsILocalFile);

		    return file;
	    } catch (ex) {
		    return null;
	    }
    }
}

/**
 * The IBWUpdater main class.
 */
function IBWUpdater() {
	this.wrappedJSObject = this
	
	var that = this;
	
	var updaterURL = "";
	var lastChecked = null;
	var updaterDialog = null;

	var packages = new IBWUpdaterPackages();

	var localUID = "";

	// Initialize IBWUpdater
	init();
	
	/**
	 * Init IBWUpdater and check if packages available.
	 */
	function init() {
		updaterURL = "http://service.bibliothek.tu-ilmenau.de/ibwupd/";

		// get local UID for user specified scripts
		var profDir = IBWUpdaterHelper.getSpecialDir("Home", Components.interfaces.nsIFile);
		if (profDir != null) {
			var parts = profDir.path.split("\\");
			localUID = parts[parts.length - 1].toLowerCase();
		}

		checkUpdates();
	}

	/**
	 * Open the Updater dialog.
	 */
	function openUpdaterDialog() {
		var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
		updaterDialog = ww.openWindow(null, "chrome://ibw/content/xul/IBWUpdaterDialog.xul", "", "chrome,dialog=yes,centerscreen", that);
	}

	/**
	 * Load packages from Update server.
	 */
	function loadPackages() {
		if (updaterURL == "") {
			var message = I18N.getLocalizedMessage("general.NoConnection");
			throw new IBWUpdaterException(message);
		}

		var url_query = updaterURL + "packages.php?uid=" + localUID;

		try {
			parsePackages(IBWUpdaterHelper.readXML(url_query, "UTF-8", true));
		} catch (ex) {
			throw new IBWUpdaterException(ex);
		}
	}

	/**
	 * Parse packages from update server response.
	 */
	function parsePackages(doc) {
		if (doc != null) {
			var pkgs = doc.getElementsByTagName("package");
			for (var c = 0; c < pkgs.length; c++) {
				var pkg = new IBWUpdaterPackage();

				pkg.setID(pkgs.item(c).getAttribute("id"));
				pkg.setType(pkgs.item(c).getAttribute("type"));
				pkg.setVersion(pkgs.item(c).getAttribute("version"));

				pkg.setName(pkgs.item(c).getElementsByTagName("name").item(0).textContent);

				if (pkgs.item(c).getElementsByTagName("description").length != 0)
					pkg.setDescription(pkgs.item(c).getElementsByTagName("description").item(0).textContent);

				// type common
				if (pkgs.item(c).getElementsByTagName("url").length != 0)
					pkg.setUrl(updaterURL + pkgs.item(c).getElementsByTagName("url").item(0).textContent);
				if (pkgs.item(c).getElementsByTagName("startupScript").length != 0)
					pkg.setStartupScript(pkgs.item(c).getElementsByTagName("startupScript").item(0).textContent);

				// type user
				if (pkgs.item(c).getElementsByTagName("function").length != 0) {
					for ( var i = 0; i < pkgs.item(c).getElementsByTagName("function").length; i++) {
						var funcElm = pkgs.item(c).getElementsByTagName("function").item(i);
						pkg.setFunction(funcElm.getAttribute("name"), funcElm.getAttribute("params"), funcElm.firstChild.data);
					}
				}

				packages.addPackage(pkg);
			}
		}
	}

	/**
	 * Checks if updates available.
	 */
	function checkUpdates() {
		try {
			if (lastChecked == undefined)
				lastCheck = new Date();

			loadPackages();
		} catch (ex) {
			throw new IBWUpdaterException(ex);
		}
	}

	/**
	 * Set the Update Server Url
	 * 
	 * @function {public} ?
	 * @param {String}
	 *            url
	 * @throws IBWUpdaterException
	 *             on no response or wrong URL
	 */
	this.setUpdateSrvUrl = function(url) {
		var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

		try {
			var channel = ioService.newChannel(url + "packages.xml", "UTF-8", null);
			channel.QueryInterface(Components.interfaces.nsIHttpChannel);
			channel.open();

			if (channel.responseStatus == 200) {
				updaterURL = url;
			} else {
				throw new IBWUpdaterException(I18N.getLocalizedMessage("general.faildConnection"));
			}
		} catch (exception) {
			throw new IBWUpdaterException(I18N.getLocalizedMessage("general.invalidURL", url));
		}
	};

	/**
	 * Get the Update Server Url that was set.
	 * 
	 * @function {public String} ?
	 * @return The set URL
	 */
	this.getUpdateSrvUrl = function() {
		return updaterURL;
	};
	
	/**
	 * Returns <code>true</code> if updates available.
	 * 
	 * @return boolean - if updates available.
	 */
	this.hasUpdates = function() {
		return (packages instanceof IBWUpdaterPackages) && (packages.count() != 0);
	}

	/**
	 * Returns <code>true</code> if currently on processing.
	 * 
	 * @return boolean - if on processing
	 */
	this.isProcessing = function() {
		return packages.isProcessing();
	}

	/**
	 * Used to start Dialog and begin updates.
	 */
	this.start = function() {
		openUpdaterDialog();
	}

	/**
	 * Starts package download and installation process.
	 * 
	 * @param {Object}
	 *            progressCallback - the progress Callback function.
	 */
	this.processPackages = function(progressCallback) {
		try {
			packages.startProcessing(progressCallback);
		} catch (ex) {
			throw new IBWUpdaterException(ex);
		}
	}
}

// === IBWUpdaterPackages ===

/**
 * IBWUpdaterPackages compare packages from remote server with installed once.
 * If an package not found on local installed the would downloaded, extract and
 * installed.
 */
function IBWUpdaterPackages() {
	var that = this;
	
	// callbacks
	var progressCallback = null;

	// packages data
	var localPackages = new Array();
	var packages = new Array();
	var processing = false;

	// progress data (for callback)
	var progress = {
	    name : "",
	    step : "",
	    single : 0,
	    total : 0
	}

	// package data
	var pID = -1;
	var pProcessing = false;
	var packageFile = null;

	// HTTP channel
	var mChannel = null;

	// init local packages
	loadInstalled();
	
	/**
	 * Adds an package to local installed.
	 * 
	 * @param {IBWUpdaterPackage}
	 *            aPackage - the package object
	 */
	function addToInstalled(aPackage) {
		if (aPackage instanceof IBWUpdaterPackage) {
			localPackages.push(aPackage);
		}
	}
	
	/**
	 * Load installed packages.
	 */
	function loadInstalled() {
		var localPackagesFile = IBWUpdaterHelper.getSpecialDir("BinDir", Components.interfaces.nsILocalFile);
		localPackagesFile.appendRelativePath("chrome\\installed-packages.xml");

		if (localPackagesFile.exists()) {
			try {
				var doc = IBWUpdaterHelper.readXML(localPackagesFile);
				if (doc != null) {
					localPackages = new Array();

					var pkgs = doc.getElementsByTagName("package");
					for ( var c = 0; c < pkgs.length; c++) {
						var pkg = new IBWUpdaterPackage();
						
						pkg.setID(pkgs.item(c).getAttribute("id"));
						pkg.setType(pkgs.item(c).getAttribute("type"));
						pkg.setVersion(pkgs.item(c).getAttribute("version"));

						if (pkgs.item(c).getElementsByTagName("fileList").length != 0) {
							var fileList = new Array();
							for ( var i = 0; i < pkgs.item(c).getElementsByTagName("file").length; i++) {
								fileList.push(pkgs.item(c).getElementsByTagName("file").item(i).textContent)
							}
							pkg.setFileList(fileList);
						}
						if (pkgs.item(c).getElementsByTagName("startupScript").length != 0)
							pkg.setStartupScript(pkgs.item(c).getElementsByTagName("startupScript").item(0).textContent);

						// type user
						if (pkgs.item(c).getElementsByTagName("function").length != 0) {
							for ( var i = 0; i < pkgs.item(c).getElementsByTagName("function").length; i++) {
								var funcElm = pkgs.item(c).getElementsByTagName("function").item(i);
								pkg.setFunction(funcElm.getAttribute("name"), funcElm.getAttribute("params"));
							}
						}

						addToInstalled(pkg);
					}
				}
			} catch (ex) {
				throw new IBWUpdaterException(ex);
			}
		}
	}

	/**
	 * Save installed packages
	 */
	function saveInstalled() {
		var xml = null;

		for ( var c in localPackages) {
			var pkg = localPackages[c];

			if (xml == null) {
				xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
				xml += "<packages>\n";
			}

			xml += "\t<package id=\"" + pkg.getID() + "\" type=\"" + pkg.getType() + "\" version=\"" + pkg.getVersion() + "\">\n";

			if (pkg.getType() == "common") {
				var fileList = pkg.getFileList();
				if (fileList.length != 0) {
					xml += "\t\t<fileList>\n";
					for ( var i in fileList) {
						xml += "\t\t\t<file>" + fileList[i] + "</file>\n";
					}
					xml += "\t\t</fileList>\n";
				}
				if (pkg.getStartupScript() != null) {
					xml += "\t\t<startupScript>" + pkg.getStartupScript() + "</startupScript>\n";
				}
			} else if (pkg.getType() == "user") {
				var funcs = pkg.getFunction();
				if (funcs.length != 0) {
					for (var i in funcs) {
						xml += "\t\t<function name=\"" + funcs[i].name + "\"" + (funcs[i].params != null ? " params=\"" + funcs[i].params + "\"" : "" ) + "/>\n";
					}
				}
			}

			xml += "\t</package>\n";
		}

		if (xml == null) {
			xml = "<?xml version=\"1.0\"?>\n";
			xml += "<packages />";
		} else
			xml += "</packages>";

		try {
			var localPackagesFile = IBWUpdaterHelper.getSpecialDir("BinDir", Components.interfaces.nsILocalFile);
			localPackagesFile.appendRelativePath("chrome\\installed-packages.xml");

			if (!IBWUpdaterHelper.writeFile(localPackagesFile, xml)) {
				throw new IBWUpdaterException(I18N.getLocalizedMessage("packages.error.writeCommonInstalled"));
			}
		} catch (ex) {
			throw new IBWUpdaterException(ex);
		}
	}

	/**
	 * Checks if given package is installed.
	 * 
	 * @param {IBWUpdaterPackage}
	 *            aPackage - the package object
	 */
	function isInstalled(aPackage) {
		if (localPackages.length != 0) {
			for ( var c in localPackages) {
				var pkg = localPackages[c];
				if (pkg.compareTo(aPackage) == 0)
					return true;
			}
		}

		return false;
	}

	/**
	 * Update an local insatlled package.
	 * 
	 * @param {IBWUpdaterPackage}
	 *            aPackage - the package object
	 */
	function updateInstalled(aPackage) {
		if (aPackage instanceof IBWUpdaterPackage) {
			var counter = localPackages.length;
			for ( var c = 0; c < counter; c++) {
				if (localPackages[c].getID() == aPackage.getID()) {
					counter = c;
					break;
				}
			}

			localPackages[counter] = aPackage;
		}
	}
	
	/**
	 * Download the package from package URL.
	 */
	function downloadPackage() {
		if (!pProcessing) {
			pProcessing = true;

			var curPackage = packages[pID];

			// https://developer.mozilla.org/en-US/docs/Creating_Sandboxed_HTTP_Connections
			try {
				var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
				var uri = ioService.newURI(curPackage.getUrl(), null, null);
				mChannel = ioService.newChannelFromURI(uri);

				try {
					// bypass cache
					mChannel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;
				} catch (ex) {
					// ignore Exception
				}

				var listener = new that.StreamListener(that, packageFile, function(aClazz, succes) {
					aClazz.onDownloadDone(succes)
				}, function(aClazz, aProgress, aProgressMax) {
					aClazz.onPackageProgress(aProgress, aProgressMax)
				});

				mChannel.notificationCallbacks = listener;
				mChannel.asyncOpen(listener, null);
			} catch (ex) {
				throw new IBWUpdaterException(ex);
			}
		}
	}
	
	/**
	 * Set the startup script file.
	 * 
	 * @param {String}
	 *            aStartupScript - the startup script
	 * @returns {Boolean}
	 */
	function setStartupScript(aStartupScript) {
		try {
			var defaultPref = IBWUpdaterHelper.getSpecialDir("PrfDef");
			defaultPref.append("setup.js");
			prefParser = new IBWUpdaterPrefParser(defaultPref);
			var children = prefParser.getChildren("ibw.standardScripts.script");

			if (children != undefined) {
				var index = -1;
				for ( var c in children) {
					if (prefParser.getCharPref("ibw.standardScripts.script" + children[c]) == aStartupScript) {
						return true;
					}
					var curIndex = Number(children[c].substr(1));
					if (index < curIndex)
						index = curIndex + 1;
				}

				// set on user prefs
				prefParser.setCharPref("ibw.standardScripts.script." + index, aStartupScript);
				prefParser.savePreferences();

				return true;
			}
		} catch (ex) {
			throw new IBWUpdaterException(ex);
		}

		return false;
	}
	
	/**
	 * Installs the package.
	 */
	function installPackage() {
		var curPackage = packages[pID];

		if (curPackage.getType() == "common") {
			progress.step = I18N.getLocalizedMessage("packages.step.Extract");

			extractPackage();

			// cleanup
			packageFile.remove(false);

			setStartupScript("resource:/" + curPackage.getStartupScript());
		} else if (curPackage.getType() == "user") {
			progress.step = I18N.getLocalizedMessage("packages.step.InstallScript");

			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("ibw.userscript");

			var userScriptPath = prefs.getCharPref(".location.loadandSave");
			var userScriptFile = null;
			var userScriptData = null;

			if (userScriptPath != null) {
				try {
					userScriptFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
					userScriptFile.QueryInterface(Components.interfaces.nsIFile);
					userScriptFile.initWithPath(userScriptPath);
				} catch (ex) {
					userScriptFile = null;
				}
			}

			if (userScriptFile == null) {
				userScriptFile = IBWUpdaterHelper.getSpecialDir("ProfD");
				userScriptFile.append("winibw.js");
			}
			
			var jsParser = new IBWUpdaterJSParser(userScriptFile);

			var func = curPackage.getFunction();
			for ( var c in func) {
				var comment = "/**\n";
				comment += " * @id " + curPackage.getID() + "\n";
				comment += " * @package " + curPackage.getName() + "\n";
				if (curPackage.getDescription() != null)
					comment += " * @description " + curPackage.getDescription() + "\n";
				comment += " * @version " + curPackage.getVersion() + "\n";
				comment += " */\n";
					
				jsParser.setFunction({name: func[c].name, params: func[c].params, code: func[c].code, comment: comment})

				that.onPackageProgress(c + 1, func.length);
			}

			jsParser.save();

			prefs.setCharPref(".language", "JS");
			prefs.setCharPref(".location.loadandSave", userScriptFile.path);
		} else
			throw new IBWUpdaterException("Unknown package type \"" + curPackage.getType() + "\"!");

		updateInstalled(curPackage);

		pProcessing = false;
	}

	/**
	 * Extract the package to BinDir.
	 */
	function extractPackage() {
		if (packageFile.exists()) {
			var targetFile = IBWUpdaterHelper.getSpecialDir("BinDir", Components.interfaces.nsIFile);

			var extractor = new IBWUpdaterPackageExtractor(packageFile, targetFile.path, that, function(clazz, aProgress, aProgressMax) {
				clazz.onPackageProgress(aProgress, aProgressMax);
			});

			extractor.extractPackage();

			// set the installed files
			packages[pID].setFileList(extractor.getFileList());
		}
	}
	
	/**
	 * Process the next package.
	 */
	function nextPackage() {
		if (!pProcessing) {
			if (pID == -1) {
				pID = 0;
			} else if (pID < packages.length - 1) {
				pID++;
			} else {
				progress.step = I18N.getLocalizedMessage("packages.step.Done");
				progress.total = 100;
				progressCallback(progress);

				saveInstalled();

				processing = false;
				return;
			}

			var curPackage = packages[pID];
			progress.name = curPackage.getName();
			progress.total = Math.round((pID / packages.length) * 100);

			if (curPackage.getType() == "common") {
				progress.step = I18N.getLocalizedMessage("packages.step.Download");
				progressCallback(progress);
				
				packageFile = IBWUpdaterHelper.getSpecialDir("TmpD", Components.interfaces.nsIFile);

				var urlParts = curPackage.getUrl().split("/");

				packageFile.append(urlParts[urlParts.length - 1]);
				packageFile.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);
				
				downloadPackage();
			} else {
				installPackage();

				nextPackage();
			}
		}
	}
	
	/**
	 * Returns the count of packages.
	 * 
	 * @return {Integer} count of packages
	 */
	this.count = function() {
		return packages.length;
	}


	/**
	 * Returns <code>true</code> if download/installation process on running.
	 * 
	 * @return {Boolean} if download/installation process on running.
	 */
	this.isProcessing = function() {
		return processing;
	}



	/**
	 * Adds an new package.
	 * 
	 * @param {IBWUpdaterPackage}
	 *            aPackage - the package object
	 */
	this.addPackage = function(aPackage) {
		if (!isInstalled(aPackage)) {
			packages.push(aPackage);
		}
	}

	/**
	 * Starts processing.
	 * 
	 * @param {Object}
	 *            aProgressCallback - the Callback function for progress updates
	 */
	this.startProcessing = function(aProgressCallback) {
		if (!processing) {
			processing = !processing;
			progressCallback = aProgressCallback;

			nextPackage();

			if (!pProcessing)
				return;
		}
	}
	
	/**
	 * Is called if download was done.
	 * 
	 * @param {Boolean}
	 *            success - if downloading was successfully
	 */
	this.onDownloadDone = function(success) {
		if (success) {
			installPackage();
		}

		nextPackage();
	}

	/**
	 * The Callback function for progress updates.
	 * 
	 * @param {Integer}
	 *            aProgress - the current progress value
	 * @param {Integer}
	 *            aProgressMax - the max value of progress
	 */
	this.onPackageProgress = function(aProgress, aProgressMax) {
		if (aProgress != undefined && aProgressMax != undefined) {
			progress.single = Math.round((aProgress / aProgressMax) * 100);
			progressCallback(progress);
		}
	}
}

/**
 * StreamListener function for package downloading and progress updates and save
 * of package of given file.
 * 
 * @param {Object}
 *            aClazz - the class witch is include the complete/progress Callback
 *            function.
 * @param {nsIFile}
 *            aFile - the file of package
 * @param {Object}
 *            aCompleteFunc - the Callback function if downloading complete
 * @param {Object}
 *            aProgressFunc - the Callback function of dowload progress
 */
IBWUpdaterPackages.prototype.StreamListener = function(aClazz, aFile, aCompleteFunc, aProgressFunc) {
	return ({
	    mClazz : aClazz,
	    mFile : aFile,
	    mCompleteFunc : aCompleteFunc,
	    mProgressFunc : aProgressFunc,

	    // nsIStreamListener
	    onStartRequest : function(aRequest, aContext) {
		    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
		    foStream.init(this.mFile, 0x2A, 00666, 0);

		    this.outputStream = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
		    this.outputStream.setOutputStream(foStream);
	    },

	    onDataAvailable : function(aRequest, aContext, aStream, aSourceOffset, aLength) {
		    if (this.outputStream != null) {
			    var bistream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
			    bistream.setInputStream(aStream);
			    var n = 0;
			    while (n < aLength) {
				    var ba = bistream.readByteArray(bistream.available());
				    this.outputStream.writeByteArray(ba, ba.length);
				    n += ba.length;
			    }
		    }
	    },

	    onStopRequest : function(aRequest, aContext, aStatus) {
		    this.outputStream.close();

		    if (Components.isSuccessCode(aStatus)) {
			    // request was successfull
			    this.mCompleteFunc(this.mClazz, true);
		    } else {
			    // request failed
			    this.mCompleteFunc(this.mClazz, false);
			    this.mFile.remove(false);
		    }

		    this.mChannel = null;
	    },

	    // nsIChannelEventSink
	    onChannelRedirect : function(aOldChannel, aNewChannel, aFlags) {
		    // if redirecting, store the new channel
		    this.mChannel = aNewChannel;
	    },

	    // nsIInterfaceRequestor
	    getInterface : function(aIID) {
		    try {
			    return this.QueryInterface(aIID);
		    } catch (e) {
			    throw Components.results.NS_NOINTERFACE;
		    }
	    },

	    // nsIProgressEventSink (not implementing will cause annoying
	    // exceptions)
	    onProgress : function(aRequest, aContext, aProgress, aProgressMax) {
		    this.mProgressFunc(this.mClazz, aProgress, aProgressMax);
	    },
	    onStatus : function(aRequest, aContext, aStatus, aStatusArg) {
	    },

	    // nsIHttpEventSink (not implementing will cause annoying exceptions)
	    onRedirect : function(aOldChannel, aNewChannel) {
	    },

	    // we are faking an XPCOM interface, so we need to implement QI
	    QueryInterface : function(aIID) {
		    if (aIID.equals(Components.interfaces.nsISupports) || aIID.equals(Components.interfaces.nsIInterfaceRequestor)
		            || aIID.equals(Components.interfaces.nsIChannelEventSink) || aIID.equals(Components.interfaces.nsIProgressEventSink)
		            || aIID.equals(Components.interfaces.nsIHttpEventSink) || aIID.equals(Components.interfaces.nsIStreamListener))
			    return this;

		    throw Components.results.NS_NOINTERFACE;
	    }
	});
}

// === IBWUpdaterPackage ===

/**
 * Data holder and package processor.
 * 
 * @returns The IBWUpdaterPackage
 */
function IBWUpdaterPackage() {
	var id = "";
	var type = "common";
	var version = 0;
	var name = "";
	var description = "";
	var url = "";
	var startupScript = "";
	var func = new Array();

	// installed files - for remove operation
	var fileList = new Array();
	
	/**
	 * Set package id.
	 * 
	 * @param aId
	 */
	this.setID = function(aId) {
		id = aId == null ? "" : aId;
	}

	/**
	 * Get package id.
	 * 
	 * @return The package id
	 */
	this.getID = function() {
		return id;
	}

	/**
	 * Set package type.
	 * 
	 * @param aType
	 */
	this.setType = function(aType) {
		type = aType == null ? "common" : aType;
	}

	/**
	 * Get package type.
	 * 
	 * @return The package type
	 */
	this.getType = function() {
		return type;
	}

	/**
	 * Set package version.
	 * 
	 * @param aVersion
	 */
	this.setVersion = function(aVersion) {
		version = aVersion == null ? 0 : aVersion;
	}

	/**
	 * Get package version.
	 * 
	 * @return The package version
	 */
	this.getVersion = function() {
		return version;
	}

	/**
	 * Set package name.
	 * 
	 * @param aName
	 */
	this.setName = function(aName) {
		name = aName == null ? "" : aName;
	}

	/**
	 * Get package name.
	 * 
	 * @return The package name
	 */
	this.getName = function() {
		return name;
	}

	/**
	 * Set package description.
	 * 
	 * @param aDescription
	 */
	this.setDescription = function(aDescription) {
		description = aDescription == null ? "" : aDescription;
	}

	/**
	 * Get package description.
	 * 
	 * @return The package description
	 */
	this.getDescription = function() {
		return description;
	}

	/**
	 * Set package download url.
	 * 
	 * @param aUrl
	 */
	this.setUrl = function(aUrl) {
		url = aUrl == null ? "" : aUrl;
	}

	/**
	 * Get Package download url.
	 * 
	 * @return The package url
	 */
	this.getUrl = function() {
		return url;
	}

	/**
	 * Set package startup script.
	 * 
	 * @param {String}
	 *            aStartupScript - the startup script
	 */
	this.setStartupScript = function(aStartupScript) {
		startupScript = aStartupScript == null ? "" : aStartupScript;
	}

	/**
	 * Get Package startup script.
	 * 
	 * @return {String} The package startup script
	 */
	this.getStartupScript = function() {
		return startupScript;
	}

	/**
	 * Set package file list.
	 * 
	 * @param {Array}
	 *            aFileList - the file list
	 */
	this.setFileList = function(aFileList) {
		fileList = aFileList == null ? new Array() : aFileList;
	}

	/**
	 * Get Package file list.
	 * 
	 * @return {Array} The file list
	 */
	this.getFileList = function() {
		return fileList;
	}

	/**
	 * Set or add a function.
	 * 
	 * @param {String}
	 *            aName - the function name
	 * @param {String}
	 *            aParams - the function parameter
	 * @param {String}
	 *            aCode - the function code
	 */
	this.setFunction = function(aName, aParams, aCode) {
		for ( var c in func) {
			if (func[c].name == aName) {
				func[c].code == aCode;
				return;
			}
		}

		func.push({
		    name : aName,
		    params: aParams,
		    code : aCode
		});
	}

	/**
	 * Returns the function object for given name or an array of functions. <br>
	 * Syntax of function Object:<br>
	 * <code>
	 * {name: aName, code: aCode}
	 * </code>
	 * 
	 * @param {String}
	 *            aName - the function name
	 * @return {[Array]Object} - the function object or an array of functions
	 */
	this.getFunction = function(aName) {
		if (aName == null)
			return func;

		for ( var c in func) {
			if (func[c].name == aName) {
				return func[c];
			}
		}

		return null;
	}

	/**
	 * Compare two packages with each other and returns <code>-1</code> if
	 * package version below other package or the <b>id</b> is not the same,
	 * <code>0</code> on equal and <code>1</code> if version greater.
	 * 
	 * @param {IBWUpdaterPackage}
	 *            other
	 * @return the result
	 */
	this.compareTo = function(other) {
		if (other instanceof IBWUpdaterPackage) {
			if (id != other.getID())
				return -1;
			if (version > other.getVersion())
				return -1;
			if (version < other.getVersion())
				return 1;

			return 0;
		} else
			return -1;
	}
}

// === IBWUpdaterPackageExtractor ===

/**
 * IBWUpdaterPackageExtractor used to extract ZIP files to WinIBW binary dir.
 * 
 * @param {nsIFile}
 *            aPackageFile - the zipped package file
 * @param {nsIFile}
 *            aPackageTargetDir - the target dir of package
 * @param {Object}
 *            aProgressFuncClass - the class witch holds the progress callback
 * @param {Object}
 *            aProgressFunc - the progress callback
 */
function IBWUpdaterPackageExtractor(aPackageFile, aPackageTargetDir, aProgressFuncClass, aProgressFunc) {
	var packageFile = aPackageFile;
	var targetDir = aPackageTargetDir;

	var progressClass = aProgressFuncClass;
	var progressFunc = aProgressFunc;

	var packageEntries = 0;

	// ignore hidden dirs/files
	var ignoreHidden = true;

	var fileList = new Array();

	function getPackageReaderWithFile(nsIFile) {
		var packageReader = Components.classes["@mozilla.org/libjar/zip-reader;1"].createInstance(Components.interfaces.nsIZipReader);
		packageReader.init(nsIFile);

		return packageReader;
	}

	function isPackage(packageReader) {
		var result = false;

		try {
			packageReader.open();
			result = true;
		} catch (ex) {
		}

		return result;
	}

	function ignoreEntry(entryName) {
		if (ignoreHidden) {
			var ignore = false;
			var parts = getPartedPath(entryName);
			for ( var c in parts) {
				if (parts[c].substr(0, 1) == ".") {
					ignore = true;
					break;
				}
			}

			return ignore;
		}

		return false;
	}

	function getPackageInfo() {
		var packageReader = getPackageReaderWithFile(packageFile);
		if (!isPackage(packageReader)) {
			return;
		}

		var entries = packageReader.findEntries("*");

		while (entries.hasMoreElements()) {
			var entry = entries.getNext().QueryInterface(Components.interfaces.nsIZipEntry);

			if (ignoreEntry(entry.name))
				continue;

			packageEntries++;
		}

		packageReader.close();
	}

	function getFileWithPath(strFilePath) {
		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		file.QueryInterface(Components.interfaces.nsIFile);
		file.initWithPath(strFilePath);

		return file;
	}

	function getPartedPath(strEntryPath) {
		var arrPartedPath = strEntryPath.split("/");

		return arrPartedPath;
	}

	function getExtractFile(arrPartedPath) {
		var subdirs = [];
		for ( var i = 0; i < arrPartedPath.length - 1; i++) {
			subdirs.push(arrPartedPath[i]);
		}

		var file = getExtractDir(subdirs);
		file.append(arrPartedPath[arrPartedPath.length - 1]);

		return file;
	}

	function getExtractDir(arrPartedPath) {
		var dir = getFileWithPath(targetDir);

		for ( var i = 0; i < arrPartedPath.length; i++) {
			dir.append(arrPartedPath[i]);
		}

		// create target dir, even if deep directories path
		if (!dir.exists()) {
			dir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);
		}

		return dir;
	}
	
	/**
	 * Extract the given package.
	 */
	this.extractPackage = function() {
		getPackageInfo();

		var packageReader = getPackageReaderWithFile(packageFile);
		if (!isPackage(packageReader)) {
			return;
		}

		var entries = packageReader.findEntries("*");
		var counter = 0;
		while (entries.hasMoreElements()) {
			var entry = entries.getNext().QueryInterface(Components.interfaces.nsIZipEntry);
			if (ignoreEntry(entry.name))
				continue;

			var parts = getPartedPath(entry.name);

			// if current path is file's path, then extract it
			var fileName = parts[parts.length - 1];
			if (fileName != "") {
				var targetFile = getExtractFile(parts);
				packageReader.extract(entry.name, targetFile);
				fileList.push(entry.name);
			} else {
				getExtractDir(parts);
			}

			counter++;
			progressFunc(progressClass, counter, packageEntries)
		}

		packageReader.close();
	}
	
	/**
	 * Return an list of files witch was extracted.
	 * 
	 * @return {Array} file list
	 */
	this.getFileList = function() {
		return fileList;
	}
}

// === IBWUpdaterPrefParser ===

/**
 * Class to parse preferences files.
 * 
 * @param {nsIFile}
 *            aPrefFile - file to parse
 */
function IBWUpdaterPrefParser(aPrefFile) {
	var prefFile = aPrefFile;
	var prefs = new Array();

	loadPreferences();
	
	/**
	 * Load the preferences from file.
	 */
	function loadPreferences() {
		var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
		istream.init(prefFile, 0x01, 0444, 0);
		istream.QueryInterface(Components.interfaces.nsILineInputStream);

		var line = {}, lines = [], hasmore;
		do {
			hasmore = istream.readLine(line);
			var oPref = parsePref(line.value);

			if (oPref != null) {
				for ( var c in oPref) {
					prefs.push(oPref[c]);
				}
			}
		} while (hasmore);

		istream.close();
	}

	/**
	 * Save preferences to file.
	 */
	function savePreferences() {
		var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
		foStream.init(prefFile, 0x2A, 00666, 0);

		var comment = "// preferences generated by IBWUpdater on " + String(new Date) + "\r\n\r\n";
		foStream.write(comment, comment.length);

		for ( var c in prefs) {
			var value = "";
			if (prefs[c].type == "number" || prefs[c].type == "boolean")
				value = prefs[c].value;
			else
				value = "\"" + prefs[c].value + "\"";

			var prefLine = "pref(\"" + prefs[c].key + "\", " + value + ");\r\n"
			foStream.write(prefLine, prefLine.length);
		}
		foStream.close();
	}

	/**
	 * Parse preference from given single line.
	 * 
	 * @param {String}
	 *            prefLine - the line to parse
	 * @return {Array} of preference(s)
	 */
	function parsePref(prefLine) {
		function pref(aKey, aValue) {
			return {
			    key : aKey,
			    value : IBWUpdaterPrefParser.encodeValue(aValue),
			    type : typeof (aValue)
			};
		}

		var result = null;

		while (prefLine.indexOf("pref(") != -1) {
			var eOffset = prefLine.indexOf(");");
			if (eOffset != -1) {
				eOffset += 2;

				var part = prefLine.substr(prefLine.indexOf("pref("), eOffset);

				if (result == null)
					result = new Array();

				result.push(eval(part));

				prefLine = prefLine.substr(eOffset);
			}
		}

		return result;
	}
	
	/**
	 * Load the preferences from file.
	 */
	this.loadPreferences = function() {
		loadPreferences;
	}
	
	/**
	 * Save preferences to file.
	 */
	this.savePreferences = function() {
		savePreferences();
	}

	/**
	 * Returns a list of children for given branch.
	 * 
	 * @param {String}
	 *            aBranch - the branch to parse or nothing for all preferences
	 * @return {Array} of preferences keys without the branch
	 */
	this.getChildren = function(aBranch) {
		var childs = null;

		for ( var c in prefs) {
			var pref = prefs[c];

			var key = null;
			if (aBranch != undefined) {
				if (pref.key.toLowerCase().substr(0, aBranch.length) == aBranch.toLowerCase())
					key = pref.key.substr(aBranch.length);
			} else
				key = pref.key;

			if (key != null) {
				if (childs == null)
					childs = new Array();

				childs.push(key);
			}
		}

		return childs;
	}

	/**
	 * Returns an single preference from given name.
	 * 
	 * @param {String}
	 *            aPrefName - the preferences name
	 * @return {Object} the preference or null if nothing found
	 */
	this.getPref = function(aPrefName) {
		for ( var c in prefs) {
			var pref = prefs[c];
			if (pref.key.toLowerCase() == aPrefName.toLowerCase())
				return pref;
		}

		return null;
	}

	/**
	 * Set preference value for given name.
	 * 
	 * @param {String}
	 *            aPrefName - the preference name
	 * @param {Object}
	 *            aPrefValue - the preference value
	 */
	this.setPref = function(aPrefName, aPrefValue) {
		for ( var c in prefs) {
			var pref = prefs[c];
			if (pref.key.toLowerCase() == aPrefName.toLowerCase()) {
				prefs[c].value = aPrefValue;
				return;
			}
		}

		prefs.push({
		    key : aPrefName,
		    value : IBWUpdaterPrefParser.encodeValue(aPrefValue),
		    type : typeof (aPrefValue)
		});
	}

	/**
	 * Returns an string preference value for given name.
	 * 
	 * @param {String}
	 *            aPrefName - the preference name
	 * @return {String} the preference value
	 */
	this.getCharPref = function(aPrefName) {
		var pref = this.getPref(aPrefName);

		if (pref != null && pref.type == "string") {
			return pref.value;
		}

		return null;
	}

	/**
	 * Set an string preference value for given name.
	 * 
	 * @param {String}
	 *            aPrefName - the preference name
	 * @param {String}
	 *            aPrefValue - the preference value
	 */
	this.setCharPref = function(aPrefName, aPrefValue) {
		if (typeof (aPrefValue) != "string")
			throw new IBWUpdaterException("The given preference value \"" + aPrefValue + "\" isn't of type char.");

		this.setPref(aPrefName, aPrefValue);
	}

	/**
	 * Returns an integer preference value for given name.
	 * 
	 * @param {String}
	 *            aPrefName - the preference name
	 * @return {Number} the preference value
	 */
	this.getIntPref = function(aPrefName) {
		var pref = this.getPref(aPrefName);

		if (pref != null && pref.type == "number") {
			return pref.value;
		}

		return null;
	}

	/**
	 * Set an integer preference value for given name.
	 * 
	 * @param {String}
	 *            aPrefName - the preference name
	 * @param {Number}
	 *            aPrefValue - the preference value
	 */
	this.setIntPref = function(aPrefName, aPrefValue) {
		if (typeof (aPrefValue) != "number")
			throw new IBWUpdaterException("The given preference value \"" + aPrefValue + "\" isn't of type int.");

		this.setPref(aPrefName, aPrefValue);
	}

	/**
	 * Returns an boolean preference value for given name.
	 * 
	 * @param {String}
	 *            aPrefName - the preference name
	 * @return {Boolean} the preference value
	 */
	this.getBoolPref = function(aPrefName) {
		var pref = this.getPref(aPrefName);

		if (pref != null && pref.type == "boolean") {
			return pref.value;
		}

		return null;
	}

	/**
	 * Set an boolean preference value for given name.
	 * 
	 * @param {String}
	 *            aPrefName - the preference name
	 * @param {Boolean}
	 *            aPrefValue - the preference value
	 */
	this.setBoolPref = function(aPrefName, aPrefValue) {
		if (typeof (aPrefValue) != "boolean")
			throw new IBWUpdaterException("The given preference value \"" + aPrefValue + "\" isn't of type boolean.");

		this.setPref(aPrefName, aPrefValue);
	}
}

/**
 * Encodes the preference value.
 */
IBWUpdaterPrefParser.encodeValue = function(aValue) {
	if (typeof (aValue) == "string") {
		aValue = aValue.replace(/\\/g, '\\\\');
		aValue = aValue.replace(/"/g, '\\"');
	}

	return aValue;
}

// === IBWUpdaterJSParser ===

/**
 * IBWUpdaterJSParser is a simple JavaScript parser and formater with the
 * ability to overwrite functions with custom comments and code.
 * 
 * @param {nsIFile}
 *            aJSFile - the JavaScript file
 */
function IBWUpdaterJSParser(aJSFile) {
	const lineSeparator = "\n";
	
	var that = this;

	var jsFile = aJSFile;
	var jsLines = new Array();

	var jsFunctions = new Array();
	var jsUnknown = "";

	// load JavaScript file on init
	loadFile();

	/**
	 * Load given JavaScript file.
	 */
	function loadFile() {
		if (jsFile.exists()) {
    		var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
    		istream.init(jsFile, 0x01, 0444, 0);
    		istream.QueryInterface(Components.interfaces.nsILineInputStream);
    
    		var line = {}, hasmore;
    		do {
    			hasmore = istream.readLine(line);
    			if (line.value.indexOf("} function") != -1) {
    				var lines = line.value.replace(/\} function/g, "}\nfunction").split("\n");
    				for (var c in lines)
    					jsLines.push(lines[c]);
    			} else {
    				jsLines.push(line.value);
    			}
    		} while (hasmore);
    
    		istream.close();
    
    		parseFile();
		}
	}
	
	/**
	 * Save JavaScript file.
	 */
	function writeFile() {
		var data = formatFile();
		
		var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
	    foStream.init(jsFile, 0x2A, 00666, 0);

	    foStream.write(data, data.length);
	    foStream.close();
	}

	function trim(str) {
		return str.replace(/^\s+/, '').replace(/\s+$/, '');
	}
	
	function trimCode(aCode) {
		var code = null;
		
		if (aCode.indexOf("{") != -1) {
			code = aCode.substr(aCode.indexOf("{") + 1)
			code = code.substr(0, code.lastIndexOf("}"));
		}
		
		return code;
	}
	
	function startsWith(str, needle, withTrim) {
		if (withTrim == null || withTrim == true)
			return trim(str).substr(0, needle.length) == needle;
		else
			return str.substr(0, needle.length) == needle;
	}

	/**
	 * Parse content of JavaScript.
	 */
	function parseFile() {
		var c = 0;
		while (c < jsLines.length) {
			var comment = null;

			// read comment(s)
			var line = jsLines[c] + lineSeparator;
			if (startsWith(line, "/*")) {
				comment = line;
				c++;

				line = jsLines[c] + lineSeparator;
				while (startsWith(line, "*/") != true) {
					comment += line;
					c++;
					line = jsLines[c] + lineSeparator;
				}
				comment += line;
				c++;
				line = jsLines[c] + lineSeparator;
			}
			
			if (startsWith(line, "//")) {
				if (comment == null)
					comment = line;
				else
					comment += line;
			}
			
			// read function(s)
			if (startsWith(line, "function")) {
				var found = line.match(/function\s([^\(].*)\((.*)\)/);
				if (found) {
					var brackets = 0;
					var code = null;
				
					while (line.indexOf("{") == -1) {
						c++;
						line = jsLines[c] + lineSeparator;
					}	
					
					do {
						if (line.indexOf("{") != -1)
							brackets++;
						if (line.indexOf("}") != -1)
							brackets--;
						
						if (code == null)
							code = line;
						else
							code += line;
						
						if ((brackets != 0)) {
							c++;
							line = jsLines[c] + lineSeparator;
						}
					} while (brackets != 0);
					
					jsFunctions.push({name: found[1], params: found[2], code: trimCode(code), comment: comment});
				}
			} else {
				line = trim(line);
				if (line.length != 0) {
    				if (jsUnknown == null)
    					jsUnknown = line + lineSeparator;
    				else
    					jsUnknown += line + lineSeparator;
				}
			}
			
			// next line
			c++;
		}
	}
	
	/**
	 * Format the JavaScript
	 */
	function formatFile() {
		var data = "";
		
		jsFunctions.sort(sortFunctions);
		
		for (var c in jsFunctions) {
			var func = jsFunctions[c];
			
			if (func.comment) {
				var cLines = func.comment.split("\n");
				for (var i in cLines) {
					var line = trim(cLines[i]);
					if (line.length != 0) {
						if (startsWith(line, "*"))
							data += " " + line + lineSeparator;
						else
							data += line + lineSeparator;
					}
				}
			}
			
			data += "function " + func.name + "(" + (func.params == null ? "" : func.params) + ") {" + lineSeparator;
			var cLines = func.code.split("\n");
			for (var i in cLines) {
				var line = trim(cLines[i]);
				if (line.length != 0) {
					data += "\t" + line + lineSeparator;
				}
			}
			data += "}" + lineSeparator + lineSeparator;
		}
		
		if (jsUnknown) {
			var cLines = jsUnknown.split("\n");
			for (var i in cLines) {
				var line = trim(cLines[i]);
				if (line.length != 0) {
					data += line + lineSeparator;
				}
			}
		}
		
		return data;
	}
	
	function sortFunctions(a, b) {
		if (a.name < b.name)
			return -1;
		if (a.name == b.name)
			return 0;
		if (a.name > b.name)
			return 1;
	}
	
	/**
	 * Returns the function for given name.
	 * 
	 * @param {String}
	 *            aName - the function name
	 * @return {Object} the function object
	 */
	this.getFunction = function(aName) {
		for (var c in jsFunctions) {
			if (jsFunctions[c].name == aName)
				return jsFunctions[c];
		}
		
		return null;
	}
	
	/**
	 * Set the given function.
	 * 
	 * @param {Object}
	 *            aFunc - the function object
	 */
	this.setFunction = function(aFunc) {
		if (aFunc != null) {
			for (var c in jsFunctions) {
				if (jsFunctions[c].name == aFunc.name) {
					jsFunctions[c] = aFunc;
					return;
				}
			}
			
			jsFunctions.push(aFunc);
		}
	}
	
	/**
	 * Save JavaScript file.
	 */
	this.save = function() {
		writeFile();
	}
}

// === IBWUpdaterException ===

/**
 * Represents the IBWUpdaterException Object.
 * 
 * @param {Object}
 *            the Exception Object
 */
function IBWUpdaterException(aException) {
	var exception = aException;
	
	/**
	 * The Exception message.
	 */
	this.message = exception.message != null ? exception.message :
				(typeof(exception) == "string" ? exception : "");
	
	/**
	 * The file name within exception occured.
	 */
	this.fileName = exception.fileName == null ? "" : exception.fileName;
	
	/**
	 * The line number on there exception occured.
	 */
	this.lineNumber = exception.lineNumber == null ? "" : exception.lineNumber;
	
	/**
	 * The stack trace of exception.
	 */
	this.stack = exception.stack == null ? "" : exception.stack;
	
	/**
	 * The name of exception.
	 */
	this.name = exception.name == null ? "" : exception.name;
}

/**
 * Form a string of relevant information.
 * 
 * When providing this method, WinIBW show the returned string instead of
 * [object Object] for uncaught exceptions.
 * 
 * @return {String} information about the exception
 */
IBWUpdaterException.prototype.toString = function() {
	return (this.name != null ? (this.name + " ") : "") + 
		(this.fileName != null ? this.fileName + ":" : "") + 
		(this.lineNumber != null ? this.lineNumber + " " : "") + this.message + 
		(this.stack != null ? "\r\n" + this.stack : "");
}