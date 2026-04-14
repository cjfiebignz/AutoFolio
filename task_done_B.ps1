try {
    [console]::beep(800, 150)
    Start-Sleep -Milliseconds 80
    [console]::beep(1000, 150)
    Start-Sleep -Milliseconds 80
    [console]::beep(1200, 150)
} catch {
    Write-Host "Task complete (B)"
}