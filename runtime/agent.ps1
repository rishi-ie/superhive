$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$node = if ($env:PI_NODE) { $env:PI_NODE } else { 'node' }
& $node (Join-Path $dir 'agent-runner.mjs') @args
exit $LASTEXITCODE
