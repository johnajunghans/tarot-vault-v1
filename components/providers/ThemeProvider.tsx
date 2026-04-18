"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {

  // EXPERIMENTAL LOGIC FOR SANITIZING STORAGE KEY VALUE
  // const savedTheme = localStorage.getItem("theme")
  // const allowedThemes = props.themes ?? ["light", "dark", "system"]
  // console.log(savedTheme)
  // if (savedTheme && !allowedThemes.includes(savedTheme)) {
  //   localStorage.setItem("theme", props.defaultTheme ?? "light")
  // }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}