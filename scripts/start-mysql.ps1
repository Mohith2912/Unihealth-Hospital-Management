$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$dataPath = Join-Path $projectRoot '.runtime/mysql-data'
$mysqlExecutable = 'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysqld.exe'
if (!(Test-Path -LiteralPath $dataPath)) { throw 'Local MySQL data directory is missing. Use Docker setup in README.md on a new machine.' }
$listener = Get-NetTCPConnection -LocalPort 3307 -State Listen -ErrorAction SilentlyContinue
if ($listener) { Write-Output 'Port 3307 is already listening. Verify the connection with npm run db:init.'; exit }
$mysqlArgs = @('--no-defaults', '"--basedir=C:/Program Files/MySQL/MySQL Server 8.4"', ('"--datadir=' + $dataPath.Replace('\','/') + '"'), '--port=3307', '--bind-address=127.0.0.1', '--mysqlx=OFF', '--console')
Start-Process -FilePath $mysqlExecutable -ArgumentList $mysqlArgs -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot '.runtime/mysql-out.log') -RedirectStandardError (Join-Path $projectRoot '.runtime/mysql-error.log')
Write-Output 'Project MySQL starting on 127.0.0.1:3307.'
