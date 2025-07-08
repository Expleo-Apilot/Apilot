!macro customInstall
  CreateShortCut "$DESKTOP\ApiLot.lnk" "$INSTDIR\${APP_EXEC}" "" "$INSTDIR\resources\app.ico"
!macroend

!macro customUnInstall
  Delete "$DESKTOP\ApiLot.lnk"
!macroend
