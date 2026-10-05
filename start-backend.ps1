$ErrorActionPreference = 'Stop'
$node = 'C:\Users\ADITYA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$server = Join-Path $PSScriptRoot 'backend\server.mjs'
if (-not (Test-Path -LiteralPath $node)) { throw 'Bundled Node.js was not found on this computer.' }
if (-not (Test-Path -LiteralPath $server)) { throw 'Backend server file was not found.' }
& $node $server
