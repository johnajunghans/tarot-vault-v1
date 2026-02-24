**This is a living document of known bugs/issues to resolve in the MVP**

## View Transitions
1. Cards and background flash when switching between edit and view mode.
2. Corners of some element pop out of the sidebar inset on view transition (view transition + sidebar inset issue)

## Landing Page
1. Corners of hero card are strange looking (bulkier in an odd way)
2. Shadow on card hover does animate

## Spreads
1. ~~When new spread is created, there are zero cards with an outline prompting users to double click to add new cards. But the logic remains that prevents users from deleting a card if it is the only one.~~
2. When changes are discarded in edit spread mode, then edit mode is opened up again and attempted to close, the confirm delete modal appears even if no changes have been made (so form seems to still register as dirty)

### Mobile
1. Can't scroll well on canvas. Specifically, cannot scoll to the bottom and access the settings button to open settings sheet.
2. ~~Sidebar avatar does not contain name on mobile.~~
3. The autofocus on name fields for both card and spread panels does not work well in mobile.