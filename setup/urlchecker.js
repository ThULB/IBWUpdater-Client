function getProxyOnUIThread(aObject, aInterface) {
    var eventQSvc = Components.
            classes["@mozilla.org/event-queue-service;1"].
            getService(Components.interfaces.nsIEventQueueService);
    var uiQueue = eventQSvc.
            getSpecialEventQueue(Components.interfaces.
            nsIEventQueueService.UI_THREAD_EVENT_QUEUE);
    var proxyMgr = Components.
            classes["@mozilla.org/xpcomproxy;1"].
            getService(Components.interfaces.nsIProxyObjectManager);

    return proxyMgr.getProxyForObject(uiQueue, 
            aInterface, aObject, 5); 
    // 5 == PROXY_ALWAYS | PROXY_SYNC
}

function logMessage( msg )
{
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                           .getService(Components.interfaces.nsIConsoleService);

    if ( consoleService ) {
		consoleService.logStringMessage(msg);
    }
}


urlChecker.statusNONE = null;
urlChecker.statusOK = "chrome://ibw/content/xul/icons/progress-done.gif";
urlChecker.statusFAILED = "chrome://ibw/content/xul/icons/progress-failed.gif";
urlChecker.statusLOADING = "chrome://ibw/content/xul/icons/loading.gif";

urlChecker.NS_ERROR_MALFORMED_URI = 0x804b000a;
urlChecker.NS_ERROR_UNKNOWN_PROTOCOL = 0x804b0012;
urlChecker.NS_ERROR_CONNECTION_REFUSED = 0x804b000d;
urlChecker.NS_ERROR_PROXY_CONNECTION_REFUSED = 0x804b0048;
urlChecker.NS_ERROR_NET_TIMEOUT = 0x804b000e;
urlChecker.NS_ERROR_PORT_ACCESS_NOT_ALLOWED = 0x804b0013;
urlChecker.NS_ERROR_NET_RESET = 0x804b0014;
urlChecker.NS_ERROR_NET_INTERRUPT = 0x804b0047;
urlChecker.NS_ERROR_REDIRECT_LOOP = 0x804b001f;
urlChecker.NS_ERROR_UNKNOWN_HOST = 0x804b001e;
urlChecker.NS_ERROR_UNKNOWN_PROXY_HOST = 0x804b002a;

urlChecker.ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

urlChecker.errorToString = function(theStatus) {
		var detail = "";
		switch (theStatus) {
			case urlChecker.NS_ERROR_MALFORMED_URI:
				detail = "malformed URI";
				break;
				
			case urlChecker.NS_ERROR_UNKNOWN_PROTOCOL:
				detail = "unknown protocol";
				break;
			
			case urlChecker.NS_ERROR_MALFORMED_URI:
				detail = "malformed URI";
				break;
		
			case urlChecker.NS_ERROR_CONNECTION_REFUSED:
				detail = "connection refused";
				break;

			case urlChecker.NS_ERROR_PROXY_CONNECTION_REFUSED:
				detail = "proxy connection refused";
				break;
				
			case urlChecker.NS_ERROR_NET_TIMEOUT:
				detail = "network timeout";
				break;

			case urlChecker.NS_ERROR_PORT_ACCESS_NOT_ALLOWED:
				detail = "port access not allowed";
				break;

			case urlChecker.NS_ERROR_NET_RESET:
				detail = "connection reset";
				break;

			case urlChecker.NS_ERROR_NET_INTERRUPT:
				detail = "connection interrupted";
				break;
				
			case urlChecker.NS_ERROR_REDIRECT_LOOP:
				detail = "to many redirections";
				break;

			case urlChecker.NS_ERROR_UNKNOWN_HOST:
				detail = "unknown host";
				break;

			case urlChecker.NS_ERROR_UNKNOWN_PROXY_HOST:
				detail = "unknown proxy host";
				break;
				
			default:
				detail = "unknown error";
				break;
		}
		return detail;
};


function urlChecker() {
}

urlChecker.prototype = {
	mRowCount : 0,
	
	mPendingItems: 0,
	
	mItems: new Array(),
	
	mObserver: null,

	//IURLChecker
	reset: function() {
		this.mRowCount = 0;
		this.mPendingItems = 0;
		this.mObserver = 0;
		this.mItems = null;
		this.mItems = new Array();
		if (this.treebox) {
			this.treebox.invalidate();
		}
		this.treebox = null;
	},
	
	addItem: function(occurrence, url, tag) {
		var theObj = new Object();
		theObj.occurrence = occurrence;
		theObj.url = url;
		theObj.tag = tag;
		theObj.status = urlChecker.statusNONE;
		//theObj.index = this.mRowCount;
		theObj.netError = null;
		theObj.channel = null;
		theObj.httpResponseStatus = "";
		theObj.httpResponseStatusText = "";

		var theUnIndex = Components.classes["@mozilla.org/supports-PRInt32;1"].createInstance(Components.interfaces.nsISupportsPRInt32);
		var theIndex = getProxyOnUIThread(theUnIndex, Components.interfaces.nsISupportsPRInt32);
		theIndex.data = this.mRowCount;
		theObj.index = theIndex;
		
		try {
			var theChannel = urlChecker.ioService.newChannel(url, "utf-8", null);
		}
		catch (exc) {
			theObj.netError = urlChecker.errorToString(exc.result);
			theObj.status = urlChecker.statusFAILED;
		}
		
		try {
			var theHTTPChannel = theChannel.QueryInterface(Components.interfaces.nsIHttpChannel);
		}
		catch (e) {
			theHTTPChannel = null;
		}
		
		if (theHTTPChannel == null) {
			theObj.status = urlChecker.statusFAILED;
			theObj.netError = "unsupported protocol";
		} else {
			theObj.channel = theHTTPChannel;
		}
		
		this.mItems[this.mRowCount] = theObj;
		this.mRowCount++;
		
		return true;
	},
	
	startProcessing: function(theObserver) {
		this.mObserver = theObserver;
		for (var i = 0; i < this.mRowCount; i++) {
			var theItem = this.mItems[i];
			
			if ((theItem.status == urlChecker.statusNONE) && (theItem.channel != null)) {
				try {
					var thisProxy = getProxyOnUIThread(this, Components.interfaces.nsIStreamListener);
					theItem.channel.asyncOpen(thisProxy, theItem.index);
					theItem.status = urlChecker.statusLOADING;
					this.mPendingItems++;
				}
				catch (e) {
					theItem.netError = urlChecker.errorToString(e.result);
					theItem.status = urlChecker.statusFAILED;
				}
				this.mItems[i] = theItem;
				if (this.treebox) {
					this.treebox.invalidateRow(i);
				}
			}
		}
		return true;
	},
	
	updateRecord: function(theTitleEdit) {
		/* we first remove all 85A */
		var theTag = "";

		theTitleEdit.startOfBuffer(false);
		theTag = theTitleEdit.findTag("85A", 0, true, true, false);

		while (theTag != "") {
			// hey, we should check here if it belongs to an URL we checked
			theTitleEdit.deleteLine(1);
			theTag = theTitleEdit.findTag("85A", 0, true, true, false);
		}
		
		
		/* now update any broken URLs */
		theTitleEdit.startOfBuffer(false);
		for (var i = 0; i < this.mRowCount; i++) {
			var item = this.mItems[i];
			if ((item.status == urlChecker.statusFAILED)
				&& theTitleEdit.find(item.tag, true, false, false)) {
				var newContent = item.tag + '\n';
				newContent += "85A $a";
				newContent += item.url;
				newContent += "$b";
				if (item.httpResponseStatus != "") {
					newContent += item.httpResponseStatus;
					if (item.httpResponseStatusText != "") {
						newContent += " - " + item.httpResponseStatusText;
					}
				} else {
					newContent += item.netError;
				}
				newContent += "$c";
				newContent += this.getDateString();
				theTitleEdit.insertText(newContent);
			}
		}

		return theTitleEdit.changed;
	},
	
	make2Digits: function(aNumber) {
		var retVal;
		var theNumber = parseInt(aNumber);
		if (theNumber < 10) {
			retVal = '0' + theNumber;
		} else {
			retVal = theNumber + '';
		}
		return retVal
	},
	
	getDateString: function() {
		var now = new Date();
		var retVal = now.getFullYear() + '-' + this.make2Digits(now.getMonth() + 1) + '-';
		retVal += this.make2Digits(now.getDate()) + ' ';
		retVal += this.make2Digits(now.getHours()) + ':' + this.make2Digits(now.getMinutes()) + ':';
		retVal += this.make2Digits(now.getSeconds());
		return retVal;
	},
	
	// nsIStreamListener
	onStopRequest: function(aRequest, theItem, aStatusCode) {
		// update the item display
		if (this.treebox) {
			this.treebox.invalidateRow(theItem.data);
		}
		this.mPendingItems--;
		if (this.mPendingItems == 0) {
			if (this.mObserver) {
				this.mObserver.observe(this, "processingComplete", "processingComplete");
			}
		}
	},
	
	onStartRequest: function(aRequest, theIndex) {
		var theItem = this.mItems[theIndex.data];
		var bSuccess = false;
		if (aRequest.status == Components.results.NS_OK) {
			// if we are not NS_OK, we hardly get any useable results
			try {
				var theHTTPChannel = aRequest.QueryInterface(Components.interfaces.nsIHttpChannel);
				if (theHTTPChannel.requestSucceeded) {
					bSuccess = true;
				}
				theItem.httpResponseStatus = theHTTPChannel.responseStatus;
				theItem.httpResponseStatusText = theHTTPChannel.responseStatusText;	
			}
			catch (e) {
				// too bad, we aren't http
				//application.messageBox("onStartRequest", e, "");
				theItem.netError = "unsupported protocol";
			}
		} else {
			theItem.netError = urlChecker.errorToString(aRequest.status);
		}
		theItem.channel = null;
		if (bSuccess) {
			if (this.mObserver) {
				this.mObserver.observe(this, "urlProcessed", "OK");
			}
			theItem.status = urlChecker.statusOK;
		} else {
			if (this.mObserver) {
				this.mObserver.observe(this, "urlProcessed", "FAILED");
			}
			theItem.status = urlChecker.statusFAILED;
		}
		this.mItems[theIndex.data] = theItem;
		aRequest.cancel(Components.results.NS_BINDING_ABORTED);
	},

	onDataAvailable: function(aRequest, aContext, aInputStream, aOffset, aCount) {
		aRequest.cancel(Components.results.NS_BINDING_ABORTED);
	},

	
	// nsITreeView
	get rowCount() {
		return this.mRowCount;
	},

	getCellText: function(row, column) {
		switch (column) {
			case "status":
				return "";
				
			case "url":
				return this.mItems[row].url;
				
			case "http":
				return this.mItems[row].httpResponseStatus;
				
			case "net":
				return this.mItems[row].netError;
				
			case "httpStatusText":
				return this.mItems[row].httpResponseStatusText;
		}
	},

	setTree: function(treebox) {
		this.treebox = treebox;
	},

	isContainer: function(row) {
		return false;
	},

	isSeparator: function(row) {
		return false;
	},

	isSorted: function(row) {
		return false;
	},

	getLevel: function(row) {
		return 0;
	},

	getImageSrc: function(row, col) {
		if (col == "status") {
			return this.mItems[row].status;
		}
		return null;
	},

	getRowProperties: function(row, props) {
	},

	getCellProperties: function(row, col, props) {
	},

	getColumnProperties: function(colid, col, props) {
	},

    // nsISupports interface
    // This "class" supports IURLChecker, nsITreeView, nsIStreamListener and nsISupports.
    QueryInterface: function (iid) {
        if (!iid.equals(Components.interfaces.IURLChecker) &&
			!iid.equals(Components.interfaces.nsITreeView) &&
			!iid.equals(Components.interfaces.nsIStreamListener) &&
            !iid.equals(Components.interfaces.nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
        return this;
    },
    
    
    // This Component's module implementation.  All the code below is used to get this
    // component registered and accessible via XPCOM.
    module: {
        // registerSelf: Register this component.
        registerSelf: function (compMgr, fileSpec, location, type) {
            var compReg = compMgr.QueryInterface( Components.interfaces.nsIComponentRegistrar );
            compReg.registerFactoryLocation( this.cid,
                                             "URLChecker",
                                             this.contractId,
                                             fileSpec,
                                             location,
                                             type );
        },
    
        // getClassObject: Return this component's factory object.
        getClassObject: function (compMgr, cid, iid) {
            if (!cid.equals(this.cid))
                throw Components.results.NS_ERROR_NO_INTERFACE;
    
            if (!iid.equals(Components.interfaces.nsIFactory))
                throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
    
            return this.factory;
        },
    
        /* CID for this class */
        cid: Components.ID("{EAE58EA4-CAEB-4004-A54F-BE6F79BAAA91}"),
    
        /* Contract ID for this class */
        contractId: "@oclcpica.nl/urlchecker;1",
    
        /* factory object */
        factory: {
            // createInstance: Return a new scriptInputFile object.
            createInstance: function (outer, iid) {
                if (outer != null)
                    throw Components.results.NS_ERROR_NO_AGGREGATION;
    
                return (new urlChecker()).QueryInterface(iid);
            }
        },
    
        // canUnload: n/a (returns true)
        canUnload: function(compMgr) {
            return true;
        }
    }
}

// NSGetModule: Return the nsIModule object.
function NSGetModule(compMgr, fileSpec) {
    return urlChecker.prototype.module;
}