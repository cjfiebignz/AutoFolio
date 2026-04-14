param(
    [string]$Focus = "General session work",
    [string]$Author = "ChatGPT"
)

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$readableDate = Get-Date -Format "yyyy-MM-dd HH:mm"
$summaryPath = ".\Docs\ChatSummaries\Summary_$timestamp.md"

@"
# AutoFolio Session Summary

## Session Info
- Date: $readableDate
- Focus: $Focus
- Summary Author: $Author

## Work Completed
- 

## Decisions Made
- 

## Files Created or Changed
- 

## Open Questions
- 

## Risks / Issues
- 

## Next Actions
- 

## Notes
- 
"@ | Set-Content $summaryPath

Write-Host "Summary created:"
Write-Host $summaryPath
