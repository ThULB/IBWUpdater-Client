    /*

    ## File Name Is: JarFileExtractor.js ##

    Programmed By lzlhero <lzlhero@gmail.com>, Version 0.1.1
    Refered from '%firefox-app%/components/nsExtensionManager.js' file,
    The object instanted from this class can extract ZIP or JAR file to a specified directory.

    # Example for 'extract' method
       var extractor = new JarFileExtractor();
       extractor.selectZipFile();
       extractor.selectTargetDir();
       extractor.extract();

    Or you can specify a ZIP file and target directory by Constructor
       Win OS: var extractor = new JarFileExtractor("c:\\test.zip", "c:\\Dir\\To\\Extract");
       Linux OS: var extractor = new JarFileExtractor("/home/test.zip", "/home/user/dir/to/extract");

    You can also use setXXXX method to set zip file or target directory
       extractor.setZipFile("c:\\test.zip");
       extractor.setTargetDir("c:\\Dir\\To\\Extract");


    # Example for 'extractEntryFile' method
       extractor.extractEntryFile("specified/entry.file");

    Or extract to absolute file path
       extractor.extractEntryFile("specified/entry.file", "d:\\absolute\\file\\path\\target.file");


    # Example for 'getEntryFileStream' method
       var extractor = new JarFileExtractor();
       extractor.selectZipFile();
       alert(extractor.getEntryFileStream("Inside/Path/test.txt"));


    # Example for 'isFull' method
       var extractor = new JarFileExtractor();
       extractor.selectZipFile();
       alert(extractor.isFull());


    # Example for 'isHaveEntry' method
       var extractor = new JarFileExtractor();
       extractor.selectZipFile();
       alert(extractor.isHaveEntry("Inside/Path/test.txt"));

    Hope you would like this class, happy with you!
    */


    // constructor with JarFileExtractor
    function JarFileExtractor(strZipFile, strTargetDir)
    {
       this._ZipFile = (strZipFile == null) ? "" : strZipFile;
       this._TargetDir = (strTargetDir == null) ? "" : strTargetDir;
    }

    // method for set zip file
    JarFileExtractor.prototype.setZipFile = function(strZipFile)
    {
       this._ZipFile = (strZipFile == null) ? "" : strZipFile;
    }

    // method for set target dir
    JarFileExtractor.prototype.setTargetDir = function(strTargetDir)
    {
       this._TargetDir = (strTargetDir == null) ? "" : strTargetDir;
    }

    // show file open dialog, then user can select a specified Zip/Jar file
    JarFileExtractor.prototype.selectZipFile = function()
    {
       var fp = Components.classes["@mozilla.org/filepicker;1"]
                   .createInstance(Components.interfaces.nsIFilePicker);
       fp.init(window, "Select ZIP File To Extract", fp.modeOpen);
       fp.appendFilter("ZIP Package Files","*.zip; *.jar");
       fp.appendFilters(fp.filterAll);

       // you can alse use 'persistentDescriptor' instead of 'path' to retrieve path string
       this._ZipFile = (fp.show() == fp.returnOK) ? fp.file.path : "";
    }

    // show directory select dialog, then user can select a specified directory
    JarFileExtractor.prototype.selectTargetDir = function()
    {
       var fp = Components.classes["@mozilla.org/filepicker;1"]
                   .createInstance(Components.interfaces.nsIFilePicker);
       fp.init(window, "Select Directory To Extract", fp.modeGetFolder);

       // you can alse use 'persistentDescriptor' instead of 'path' to retrieve path string
       this._TargetDir = (fp.show() == fp.returnOK) ? fp.file.path : "";
    }

    // the internal method for get nsILocalFile type object
    JarFileExtractor.prototype.getFileWithPath = function(strFilePath)
    {
       var file = Components.classes["@mozilla.org/file/local;1"]
                   .createInstance(Components.interfaces.nsILocalFile);
       file.QueryInterface(Components.interfaces.nsIFile);
       file.initWithPath(strFilePath);

       return file;
    }

    // the internal method for get nsIZipReader type object
    JarFileExtractor.prototype.getZipReaderWithFile = function(nsIFile)
    {
       var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"]
                         .createInstance(Components.interfaces.nsIZipReader);
       zipReader.init(nsIFile);

       return zipReader;
    }

    // the core extract method in JarFileExtractor
    JarFileExtractor.prototype.extract = function(strTargetDir)
    {
       if(strTargetDir != null)
       {
          this._TargetDir = strTargetDir;
       }

       if(this._ZipFile == "" || this._TargetDir == "")
       {
          return;
       }

       var file = this.getFileWithPath(this._ZipFile);
       var zipReader = this.getZipReaderWithFile(file);
       if(!this.isZip(zipReader))
       {
          return;
       }

       var entries = zipReader.findEntries("*");
       while (entries.hasMoreElements())
       {
          var entry = entries.getNext().QueryInterface(Components.interfaces.nsIZipEntry);
          var parts = this.getPartedPath(entry.name);

          // if current path is file's path, then extract it
          var fileName = parts[parts.length-1];
          if (fileName != "")
          {
             var targetFile = this.getExtractFile(parts);
             zipReader.extract(entry.name, targetFile);
          }
          else
          {
             this.getExtractDir(parts);
          }
       }

       zipReader.close();
    }

    // method for extract specified entry file
    JarFileExtractor.prototype.extractEntryFile = function(strEntryFilePath, strTargetFilePath)
    {
       var targetFile;

       if(this._ZipFile == "" || strEntryFilePath == null || strEntryFilePath == "")
       {
          return;
       }

       var parts = this.getPartedPath(strEntryFilePath);
       if(parts[parts.length-1] == "")
       {
          return;
       }

       if(strTargetFilePath == null || strTargetFilePath == "")
       {
          targetFile = this.getExtractFile(parts);
       }
       else
       {
          targetFile = this.getFileWithPath(strTargetFilePath);
          if(!targetFile.exists())
          {
             targetFile.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0755);
          }
       }

       var file = this.getFileWithPath(this._ZipFile);
       var zipReader = this.getZipReaderWithFile(file);
       if(!this.isZip(zipReader))
       {
          return;
       }

       try
       {
          var entry = zipReader.getEntry(strEntryFilePath);
          zipReader.extract(entry.name, targetFile);
       }
       catch(ex)
       {}
       zipReader.close();
    }

    // internal method for split entry path to array
    JarFileExtractor.prototype.getPartedPath = function(strEntryPath)
    {
    /*
       // for windows platform and zh-CN charset
        if(navigator.platform == "Win32")
       {
          strEntryPath = convertToUnicode("GB2312", strEntryPath);
       }
    */
       var arrPartedPath = strEntryPath.split("/");

       return arrPartedPath;
    }

    // internal method for get nsILocalFile type extract file
    JarFileExtractor.prototype.getExtractFile = function(arrPartedPath)
    {
       var subdirs = [];
       for (var i = 0; i < arrPartedPath.length - 1; i++)
       {
          subdirs.push(arrPartedPath[i]);
       }

       var file = this.getExtractDir(subdirs);
       file.append(arrPartedPath[arrPartedPath.length - 1]);

       return file;
    }

    // internal method for get nsILocalFile type extract directory
    JarFileExtractor.prototype.getExtractDir = function(arrPartedPath)
    {
       var dir = this.getFileWithPath(this._TargetDir);

       for (var i = 0; i < arrPartedPath.length; i++)
       {
          dir.append(arrPartedPath[i]);
       }

       // create target dir, even if deep directories path
       if (!dir.exists())
       {
          dir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);
       }

       return dir;
    }

    // method for get entry file stream inside zip file
    JarFileExtractor.prototype.getEntryFileStream = function(strEntryFilePath)
    {
       var result = null;

       if(this._ZipFile == "" || strEntryFilePath == null || strEntryFilePath == "")
       {
          return result;
       }

       var parts = this.getPartedPath(strEntryFilePath);
       if(parts[parts.length-1] == "")
       {
          return result;
       }

       var file = this.getFileWithPath(this._ZipFile);
       var zipReader = this.getZipReaderWithFile(file);
       if(!this.isZip(zipReader))
       {
          return result;
       }

       try
       {
          var entry = zipReader.getEntry(strEntryFilePath);
          var inputStream = zipReader.getInputStream(entry.name);
          var entryStream = Components.classes["@mozilla.org/scriptableinputstream;1"]
                         .createInstance( Components.interfaces.nsIScriptableInputStream );
          entryStream.init(inputStream);

          // you can use -1 directly get all content,
          // instead of '.available()' method for get all
          result = entryStream.read(-1);
       }
       catch(ex)
       {}
       zipReader.close();

       return result;
    }

    // internal method for check specified nsIZipReader is Zip format file or not
    JarFileExtractor.prototype.isZip = function(zipReader)
    {
       var result = false;

       try
       {
          zipReader.open();
          result = true;
       }
       catch (ex)
       {}

       return result;
    }

    // method for test specified entry inside zip file
    // the strEntryPath must be like "Inside/Path/test.txt"
    // some known bug, zip compressed in linux tests directory entry will be failed
    JarFileExtractor.prototype.isHaveEntry = function(strEntryPath)
    {
       var result = false;

       if(this._ZipFile == "" || strEntryPath == null || strEntryPath == "")
       {
          return result;
       }

       var file = this.getFileWithPath(this._ZipFile);
       var zipReader = this.getZipReaderWithFile(file);

       if(this.isZip(zipReader))
       {
          try
          {
             var entry = zipReader.getEntry(strEntryPath);
             result = true;
          }
          catch(ex)
          {}
          zipReader.close();
       }

       return result;
    }

    // method for test zip integrity
    JarFileExtractor.prototype.isFull = function()
    {
       var result = null;

       if(this._ZipFile == "")
       {
          return result;
       }

       var file = this.getFileWithPath(this._ZipFile);
       var zipReader = this.getZipReaderWithFile(file)
       if(this.isZip(zipReader))
       {
          try
          {
             zipReader.test(null);
             result = true;
          }
          catch(ex)
          {
             result = false;
          }
          zipReader.close();
       }
       else
       {
          result = false;
       }

       return result;
    }
