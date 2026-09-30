<p align="center"><img src="images/banner.png" alt="Themepane" width="100%"></p>

**Every project, its own color.**

Themepane colors each VS Code window, so you can find the right one without reading its
title bar. The **background** frames the window, and the editor, sidebar and terminal float
on it as dark panes. The **accent** runs through buttons, selections and the cursor. Your
code keeps its usual colors.

There are 40 backgrounds and 40 accents, and any of the 1,600 pairs stays soft and
readable. The backgrounds are 28 colors from Cameo to Amaranth (a few deeper, like Fathom
and Lapis), 10 muted tints like Slate and Heather, Graphite (the default) and pure-black
Obsidian. Accents come bold (Cobalt, Jade), dusty (Bronze, Pewter), pastel (Matcha, Peach)
or pearly (Nacre, Opal), plus Snow. Each background has a matching accent, so one pick is
enough, and **Custom…** takes any hex and tones it down so nothing glows.

Click **Themepane** in the status bar, pick **Background** or **Accent**, and scroll: the
window changes as you go. Enter keeps a color, Esc goes back.

## Install

Themepane isn't on the Marketplace. It installs from its GitHub release with one command.

On Linux, macOS or WSL:

```bash
curl -fsSL https://raw.githubusercontent.com/pcardenal/themepane/main/install.sh | bash
```

In Windows PowerShell:

```powershell
iwr https://github.com/pcardenal/themepane/releases/latest/download/themepane.vsix -OutFile $env:TEMP\themepane.vsix; code --install-extension $env:TEMP\themepane.vsix
```

## Under the hood

Every color is a plain `workbench.colorCustomizations` setting, so VS Code updates can't
break Themepane, and it works in local and remote windows, including WSL. The default
pair lives in your user settings; a project's colors live in its `.code-workspace` file or
`.vscode/settings.json`. Palette updates reach them on the next reload.

- **Workspace only**, at the bottom of the menu, keeps Themepane out of your repos. A
  folder then gets a workspace file in `<parent>/.workspaces/`, outside git, and **Reopen
  in workspace** switches to it (`projectColor.reopenWorkspace` does that automatically).
- **Layout**: Themepane turns on VS Code's modern layout with pill tabs, and puts your old
  settings back when you uninstall.
- **Conflicts**: if something overrides the colors, the status bar reads **Themepane ·
  Warning** and the menu offers to restore them. Clashing extensions like Peacock get
  flagged.
- **Updates**: Themepane checks GitHub daily. A new release turns the status bar item green
  and adds **Update Themepane** to the menu.

## Uninstall

Uninstall it from the Extensions view. On the next start your layout and default colors
go back to how they were. Projects keep their colors, ready for a reinstall.

To wipe those too, run **Themepane: Clean Up and Uninstall…**. It removes every Themepane
color and setting from your user settings and every workspace and folder VS Code
remembers, and lists any remote ones it can't reach.
