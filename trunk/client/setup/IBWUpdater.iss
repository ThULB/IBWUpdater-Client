[LangOptions]
LanguageName=German
LanguageID=$0407
[Languages]
Name: Deutsch; MessagesFile: compiler:Languages\German.isl
[Setup]
DefaultDirName={pf}\WinIBW30
UsePreviousAppDir=false
AppCopyright=René Adler (TU Ilmenau), 2012-
AppName=IBW Updater
AppVerName=IBW Updater (1.0)
DisableFinishedPage=true
AlwaysShowComponentsList=false
DisableReadyPage=true
UsePreviousTasks=false
ShowComponentSizes=false
LanguageDetectionMethod=locale
DirExistsWarning=no
OutputDir=.
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
Source: ..\scripts\IBWUpdater.js; DestDir: {app}\scripts; AfterInstall: installScript(); Flags: overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\lib\IBWUpdater.js; DestDir: {app}\chrome\ibw\lib; Flags: overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\content\browser\pref\pref-IBWUpdater.js; DestDir: {app}\chrome\ibw\content\browser\pref; AfterInstall: installPref(); Flags: overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\content\browser\pref\pref-IBWUpdater.xul; DestDir: {app}\chrome\ibw\content\browser\pref; Flags: overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\content\browser\pref\pref.css; DestDir: {app}\chrome\ibw\content\browser\pref; Flags: uninsneveruninstall overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\content\browser\pref\pref.xul; DestDir: {app}\chrome\ibw\content\browser\pref; Flags: uninsneveruninstall overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\locale\de-de\IBWUpdater.dtd; DestDir: {app}\chrome\ibw\locale\de-de; Flags: overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\locale\de-de\IBWUpdater.properties; DestDir: {app}\chrome\ibw\locale\de-de; Flags: overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\locale\en-us\IBWUpdater.dtd; DestDir: {app}\chrome\ibw\locale\en-us; Flags: overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\locale\en-us\IBWUpdater.properties; DestDir: {app}\chrome\ibw\locale\en-us; Flags: overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\content\xul\IBWUpdaterDialog.xul; DestDir: {app}\chrome\ibw\content\xul; Flags: overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\content\xul\IBWUpdaterDialog.js; DestDir: {app}\chrome\ibw\content\xul; Flags: overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\content\xul\IBWUpdaterSummaryDialog.xul; DestDir: {app}\chrome\ibw\content\xul; Flags: overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\content\xul\IBWUpdaterSummaryDialog.js; DestDir: {app}\chrome\ibw\content\xul; Flags: overwritereadonly replacesameversion ignoreversion
Source: ..\chrome\ibw\content\xul\icons\IBWUpdater.png; DestDir: {app}\chrome\ibw\content\xul\icons; Flags: overwritereadonly replacesameversion ignoreversion
[Code]
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
    fileName := ExpandConstant('{app}\defaults\pref\setup.js');
    inputString := 'pref("IBWUpdater.url", "http://service.bibliothek.tu-ilmenau.de/ibwupd/");';

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
    tmp: AnsiString;

    Offset: Integer;
begin
    fileName := ExpandConstant('{app}\defaults\pref\setup.js');
    inputString := 'pref("IBWUpdater.url", "http://service.bibliothek.tu-ilmenau.de/ibwupd/");';

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
