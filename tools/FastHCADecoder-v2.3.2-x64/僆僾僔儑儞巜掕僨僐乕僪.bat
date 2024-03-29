@echo off

rem ************************************************************
rem *           デフォルト値設定                               *
rem *                                                          *
rem *   音量 (1.0を通常音量として倍率で指定)                   *
set X_V=1.0
rem *                                                          *
rem *   ビットモード (8、16、24、32、float のどれかを指定)     *
set X_M=16
rem *                                                          *
rem *   ループ回数 (0以上の回数を指定)                         *
set X_L=0
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
rem 438BF1F883653699 yuyuyui

if "%~1" == "" (
  echo ※このウィンドウを閉じて、デコードしたいファイルをドラッグ＆ドロップしてください。
  pause
  exit /b
)

echo:
set X_I=
echo 何も入力しない場合、デコード処理を行います。
set /P X_I="ヘッダ情報のみ表示しますか？(何か入力するとヘッダ情報のみ表示): "
if "%X_I%" neq "" (
  echo:
  for %%f in (%*) do "%~dp0clHCA.exe" -i %%f
  pause
  exit /b
)

echo:
echo 音量を入力しない場合、1.0倍の通常音量として出力されます。
set /P X_V="音量 (1.0を通常音量として倍率で指定): "
echo:
echo ビットモードを入力しない場合、16bitPCMとして出力されます。
set /P X_M="ビットモード (8、16、24、32、float のどれかを指定): "
echo:
echo ループ回数を入力しない場合、ループしないで出力されます。
set /P X_L="ループ回数 (0以上の回数を指定): "
echo:
echo 復号鍵を入力しない場合、ミリシタで使われている鍵を使用します。
set /P X_K="復号鍵 (16進数16桁で指定): "
echo:
if "%X_M%" == "float" (set X_M=0)
set X=-v %X_V% -m %X_M% -l %X_L% -a %X_K:~8,8% -b %X_K:~0,8%
for %%f in (%*) do "%~dp0clHCA.exe" %X% %%f
echo:
pause
