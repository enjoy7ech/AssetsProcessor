@echo off

rem ************************************************************
rem *           デフォルト値設定                               *
rem *                                                          *
rem *   復号鍵 (16進数16桁で指定)                              *
set X_K=0002B875BC731A85
rem *                                                          *
rem *   復号鍵                                                 *
rem * CC55463930DBE1AB : ファンタシースターオンライン2         *
rem * 0000000077EDF21C : ロウきゅーぶ！ ひみつのおとしもの     *
rem *                                                          *
rem ************************************************************
rem 0002B875BC731A85 mirishita

if "%~1" == "" (
  echo ※このウィンドウを閉じて、復号化したいファイルをドラッグ＆ドロップしてください。
  pause
  exit /b
)

echo:
echo 復号鍵を入力しない場合、ミリシタで使われている鍵を使用します。
set /P X_K="復号鍵 (16進数16桁で指定): "
echo:
set X=-c -a %X_K:~8,8% -b %X_K:~0,8%
for %%f in (%*) do "%~dp0clHCA.exe" %X% %%f
echo:
pause
