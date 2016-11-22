[LangOptions]
LanguageName=German
LanguageID=$0407
[Languages]
Name: Deutsch; MessagesFile: compiler:German.isl
[Setup]
DefaultDirName={pf}\WinIBW30
UsePreviousAppDir=false
AppCopyright=René Adler, 2012-
AppName=IBW Updater
AppVerName=IBW Updater @@Version (@@Revision)
DisableFinishedPage=true
AlwaysShowComponentsList=false
DisableReadyPage=true
UsePreviousTasks=false
ShowComponentSizes=false
LanguageDetectionMethod=locale
DirExistsWarning=no
OutputDir=.
OutputBaseFilename=IBWUpdater-Client
InternalCompressLevel=normal
ShowLanguageDialog=no
AppendDefaultDirName=false
MergeDuplicateFiles=false
AllowCancelDuringInstall=false
PrivilegesRequired=lowest
[Dirs]
Name: {app}\scripts; Flags: uninsneveruninstall
Name: {app}\chrome; Flags: uninsneveruninstall
Name: {app}\chrome\ibw; Flags: uninsneveruninstall
Name: {app}\chrome\ibw\content; Flags: uninsneveruninstall
Name: {app}\chrome\ibw\content\xul; Flags: uninsneveruninstall
Name: {app}\chrome\ibw\lib; Flags: uninsneveruninstall
Name: {app}\chrome\ibw\locale; Flags: uninsneveruninstall
Name: {app}\chrome\ibw\locale\de-de; Flags: uninsneveruninstall
Name: {app}\chrome\ibw\content\browser; Flags: uninsneveruninstall
Name: {app}\chrome\ibw\content\browser\pref; Flags: uninsneveruninstall
[Files]
Source: {#sources}\scripts\IBWUpdater.js; DestDir: {app}\scripts; AfterInstall: installScript(); Flags: overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\lib\IBWUpdater.js; DestDir: {app}\chrome\ibw\lib; Flags: overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\content\browser\pref\pref-IBWUpdater.js; DestDir: {app}\chrome\ibw\content\browser\pref; AfterInstall: installPref(); Flags: overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\content\browser\pref\pref-IBWUpdater.xul; DestDir: {app}\chrome\ibw\content\browser\pref; Flags: overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\content\browser\pref\pref.css; DestDir: {app}\chrome\ibw\content\browser\pref; Flags: uninsneveruninstall overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\content\browser\pref\pref.xul; DestDir: {app}\chrome\ibw\content\browser\pref; Flags: uninsneveruninstall overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\locale\de-de\IBWUpdater.dtd; DestDir: {app}\chrome\ibw\locale\de-de; Flags: overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\locale\de-de\IBWUpdater.properties; DestDir: {app}\chrome\ibw\locale\de-de; Flags: overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\locale\en-us\IBWUpdater.dtd; DestDir: {app}\chrome\ibw\locale\en-us; Flags: overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\locale\en-us\IBWUpdater.properties; DestDir: {app}\chrome\ibw\locale\en-us; Flags: overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\content\xul\IBWUpdaterDialog.xul; DestDir: {app}\chrome\ibw\content\xul; Flags: overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\content\xul\IBWUpdaterDialog.js; DestDir: {app}\chrome\ibw\content\xul; Flags: overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\content\xul\IBWUpdaterSummaryDialog.xul; DestDir: {app}\chrome\ibw\content\xul; Flags: overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\content\xul\IBWUpdaterSummaryDialog.js; DestDir: {app}\chrome\ibw\content\xul; Flags: overwritereadonly replacesameversion ignoreversion
Source: {#sources}\chrome\content\xul\icons\IBWUpdater.png; DestDir: {app}\chrome\ibw\content\xul\icons; Flags: overwritereadonly replacesameversion ignoreversion
[Code]
var
  Page: TInputQueryWizardPage;
  UpdaterURL: String;

procedure InitializeWizard();
begin
  Page := CreateInputQueryPage(wpWelcome,
  'Server URL', 'Unter welcher URL ist der Updater Server zu erreichen?',
  'Bitte geben Sie die Updater Server URL ein und klicken Sie "Weiter" um fortzufahren.');
  Page.Add('URL:', False);
  Page.Values[0] := 'http://ibwupdate.ulb.uni-jena.de/';
end;

procedure installScript();
var
    fileName: String;
    inputString: String;
    tmp: AnsiString;
begin
    fileName := ExpandConstant('{app}\defaults\pref\setup.js');
    inputString := 'pref("ibw.standardScripts.script.50", "resource:/scripts/IBWUpdater.js");';

    if (LoadStringFromFile(fileName, tmp)) then
    begin
        if (Pos(inputString, tmp) = 0) then
            SaveStringToFile(fileName, #13#10 + inputString + #13#10, True);
    end;
end;

procedure installPref();
var
    fileName: String;
    inputString: String;
    tmp: AnsiString;
begin
    UpdaterURL := Page.Values[0];
    fileName := ExpandConstant('{app}\defaults\pref\setup.js');
    inputString := 'pref("IBWUpdater.url", "' + UpdaterURL + '");';

    if (LoadStringFromFile(fileName, tmp)) then
    begin
        if (Pos(inputString, tmp) = 0) then
            SaveStringToFile(fileName, #13#10 + inputString + #13#10, True);
    end;
    
    fileName := ExpandConstant('{app}\chrome\ibw\content\browser\pref\pref.xul');
    if (FileExists(fileName) and FileExists(fileName + '.bak') = false) then
    begin
        FileCopy(fileName, fileName + '.bak', false);
    end;
    
    fileName := ExpandConstant('{app}\chrome\ibw\content\browser\pref\pref.css');
    if (FileExists(fileName) and FileExists(fileName + '.bak') = false) then
    begin
        FileCopy(fileName, fileName + '.bak', false);
    end;
end;

procedure uninstallScript();
var
    fileName: String;
    inputString: String;
    tmp: AnsiString;

    Offset: Integer;
begin
    fileName := ExpandConstant('{app}\defaults\pref\setup.js');
    inputString := 'pref("ibw.standardScripts.script.50", "resource:/scripts/IBWUpdater.js");';

    if (LoadStringFromFile(fileName, tmp)) then
    begin
        if (Pos(inputString, tmp) <> 0) then
        begin
            Offset := Pos(inputString, tmp);
            Delete(tmp, Offset, Length(inputString));
            tmp := TrimRight(tmp);
            SaveStringToFile(fileName, tmp, false);
        end;
    end;
end;

procedure uninstallPref();
var
    fileName: String;
    inputString: String;
    input2String: String;
    tmp: AnsiString;

    Offset, EOffset: Integer;
begin
    fileName := ExpandConstant('{app}\defaults\pref\setup.js');
    inputString := 'pref("IBWUpdater.url"';
    input2String := ');';

    if (LoadStringFromFile(fileName, tmp)) then
    begin
        if (Pos(inputString, tmp) <> 0) then
        begin
            Offset := Pos(inputString, tmp);
            Delete(tmp, Offset, Length(inputString));
            EOffset := Pos(input2String, tmp);
            Delete(tmp, 1, EOffset + Length(input2String));
            tmp := TrimRight(tmp);
            SaveStringToFile(fileName, tmp, false);
        end;
    end;
    
    fileName := ExpandConstant('{app}\chrome\ibw\content\browser\pref\pref.xul');
    if (FileExists(fileName + '.bak')) then
    begin
        FileCopy(fileName + '.bak', fileName, false);
        DeleteFile(fileName + '.bak');
    end;
    
    fileName := ExpandConstant('{app}\chrome\ibw\content\browser\pref\pref.css');
    if (FileExists(fileName + '.bak')) then
    begin
        FileCopy(fileName + '.bak', fileName, false);
        DeleteFile(fileName + '.bak');
    end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then begin
     uninstallScript();
     uninstallPref();
  end;
end;
