# AutoFolio Architecture v1

Last updated: 2026-03-24 00:26

## App Role
AutoFolio is the personal vehicle management, service history, and reminder app in the Automotive Apps ecosystem.


## System Rules
1. AutoFolio owns user-specific and historical vehicle lifecycle data
2. AutoFolio should reference SpecHUB for master vehicle definition data
3. AutoFolio should not duplicate global technical specs as source-of-truth data
4. userVehicleID should identify each real owned vehicle instance
5. specID should be the preferred long-term link to SpecHUB
6. Architecture should support future workshop/customer interaction without breaking the core model

## Initial Focus Areas
- user vehicle structure
- service history
- parts used
- invoices and documents
- registration tracking
- insurance tracking
- reminder logic
- dashboard overview
- future workshop integration path

## Current Status
- project folder initialized
- architecture build starting
