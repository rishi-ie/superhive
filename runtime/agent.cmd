@echo off
set "DIR=%~dp0"
if "%PI_NODE%"=="" set "PI_NODE=node"
"%PI_NODE%" "%DIR%agent-runner.mjs" %*
