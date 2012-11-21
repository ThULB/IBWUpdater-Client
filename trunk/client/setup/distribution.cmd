@setlocal enableextensions enabledelayedexpansion
@echo off
cls

if "%1" == "", if "%2" == "", if "%3" == "", if "%4" == "" (
	echo Syntax:
	echo   distribution.cmd hostlist user password programm arguments
	exit /b
)

set hostlist=%1
set uid=administrator
set pwd=%3
set programm=%4
set arguments=%5

set /a noping=0
set /a installed=0
set /a previnstalled=0
set /a notinstalled=0

for /f %%i in (!hostlist!) do (
    set ipaddr=%%i
	set hostfull=!ipaddr!
	set hostshort=!ipaddr!
    for /f "skip=2 tokens=1,2 delims=:" %%a in ('2^>NUL nslookup !ipaddr!') do (
        if "%%a"=="Name" set hostfull=%%b
        set hostfull=!hostfull: =!
        for /f "tokens=1 delims=." %%a in ("!hostfull!") do (
                set hostshort=%%a
        )
    )
	
	if not exist done\!hostshort!.txt (
    	set state=down
    	for /f "tokens=1,2 delims=:" %%a in ('ping -n 1 !ipaddr!') do (
    		if "%%a" == "Antwort von !ipaddr!" if not "%%b" == " Zielhost nicht erreichbar." set state=up
    	)
    
    	if "!state!" == "up" (
    			echo Distribute to !hostshort!...
    			echo   start installation of "!programm!"...
    
    			set done=error
    			psexec \\!ipaddr! -u !uid! -p !pwd! -f -c "!programm!" "!programm!" "!arguments!" 2> psexecresult
    			for /f "tokens=7,8" %%a in (psexecresult) do (
    				if "%%a"=="code" if "%%b"=="0." set done=success
    			)
    			if "!done!" == "success" (
    				echo %date% %time% >done\!hostshort!.txt
    				echo   ...sucessfull
    				set /a installed=installed+1
    			) else (
    				copy psexecresult error\!hostshort!.txt 1>NUl 2>NUL
    				echo   ...failed
    				set /a notinstalled=notinstalled+1
    			)
    			del psexecresult
    	) else (
    		set /a noping=noping+1
    	)
    ) else (
        set /a previnstalled=previnstalled+1
    )
)

echo Summary of distribution:
echo  - unobtainable:      !noping!
echo  - already installed: !previnstalled!
echo  - successfull:       !installed!
echo  - failed:            !notinstalled!

endlocal