@echo off

set X_V=1.0
set X_M=16
set X_L=0
set X_K=0002B875BC731A85
set S_K=0000
rem 0002B875BC731A85 mirishita
rem 438BF1F883653699 yuyuyui

if "%~1" == "" (
  echo Please drag and drop files on to this file
  pause
  exit /b
)

echo:
set X_I=
echo If nothing is entered, defaults will be used
set /P X_I="Display headers?: "
if "%X_I%" neq "" (
  echo:
  for %%f in (%*) do "%~dp0clHCA.exe" -i %%f
  pause
  exit /b
)

echo:
set /P X_V="Volume (0 - 1.0): "
echo:
set /P X_M="Bit depth (0 or float for 32-bit float): "
echo:
set /P X_L="Loop count:"
echo:
set /P X_K="Decode key in hex: "
echo:
set /P S_K="Subkey in hex: "
echo:
if "%X_M%" == "float" (set X_M=0)
set X=-v %X_V% -m %X_M% -l %X_L% -a %X_K:~8,8% -b %X_K:~0,8% -s %S_K:~0,4%
for %%f in (%*) do "%~dp0clHCA.exe" %X% %%f
echo:
pause
