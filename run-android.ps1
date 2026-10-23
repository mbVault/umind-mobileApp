# U Mind — Android dev build (JDK 17 + SDK env for this session)
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$java17 = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"

$env:ANDROID_HOME = $sdk
$env:JAVA_HOME = $java17
$env:Path = "$java17\bin;$sdk\platform-tools;$sdk\emulator;" + $env:Path

Set-Location $PSScriptRoot
npx expo run:android
