@echo off

rem ************************************************************
rem *           �f�t�H���g�l�ݒ�                               *
rem *                                                          *
rem *   ���� (1.0��ʏ퉹�ʂƂ��Ĕ{���Ŏw��)                   *
set X_V=1.0
rem *                                                          *
rem *   �r�b�g���[�h (8�A16�A24�A32�Afloat �̂ǂꂩ���w��)     *
set X_M=16
rem *                                                          *
rem *   ���[�v�� (0�ȏ�̉񐔂��w��)                         *
set X_L=0
rem *                                                          *
rem *   ������ (16�i��16���Ŏw��)                              *
set X_K=0002B875BC731A85
rem *                                                          *
rem *   ������                                                 *
rem * CC55463930DBE1AB : �t�@���^�V�[�X�^�[�I�����C��2         *
rem * 0000000077EDF21C : ���E����[�ԁI �Ђ݂̂��Ƃ�����     *
rem *                                                          *
rem ************************************************************
rem 0002B875BC731A85 mirishita
rem 438BF1F883653699 yuyuyui

if "%~1" == "" (
  echo �����̃E�B���h�E����āA�f�R�[�h�������t�@�C�����h���b�O���h���b�v���Ă��������B
  pause
  exit /b
)

echo:
set X_I=
echo �������͂��Ȃ��ꍇ�A�f�R�[�h�������s���܂��B
set /P X_I="�w�b�_���̂ݕ\�����܂����H(�������͂���ƃw�b�_���̂ݕ\��): "
if "%X_I%" neq "" (
  echo:
  for %%f in (%*) do "%~dp0clHCA.exe" -i %%f
  pause
  exit /b
)

echo:
echo ���ʂ���͂��Ȃ��ꍇ�A1.0�{�̒ʏ퉹�ʂƂ��ďo�͂���܂��B
set /P X_V="���� (1.0��ʏ퉹�ʂƂ��Ĕ{���Ŏw��): "
echo:
echo �r�b�g���[�h����͂��Ȃ��ꍇ�A16bitPCM�Ƃ��ďo�͂���܂��B
set /P X_M="�r�b�g���[�h (8�A16�A24�A32�Afloat �̂ǂꂩ���w��): "
echo:
echo ���[�v�񐔂���͂��Ȃ��ꍇ�A���[�v���Ȃ��ŏo�͂���܂��B
set /P X_L="���[�v�� (0�ȏ�̉񐔂��w��): "
echo:
echo ����������͂��Ȃ��ꍇ�A�~���V�^�Ŏg���Ă��錮���g�p���܂��B
set /P X_K="������ (16�i��16���Ŏw��): "
echo:
if "%X_M%" == "float" (set X_M=0)
set X=-v %X_V% -m %X_M% -l %X_L% -a %X_K:~8,8% -b %X_K:~0,8%
for %%f in (%*) do "%~dp0clHCA.exe" %X% %%f
echo:
pause
