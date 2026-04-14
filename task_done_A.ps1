try {
    [console]::beep(1200, 150)
    Start-Sleep -Milliseconds 80
    [console]::beep(1400, 150)
    Start-Sleep -Milliseconds 80
    [console]::beep(1600, 150)
} catch {
    Write-Host "Task complete (A)"
}