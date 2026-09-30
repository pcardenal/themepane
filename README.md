<p align="center"><img src="images/banner.png" alt="Themepane" width="100%"></p>

**Know which project you're in before you read a single tab.**

Themepane gives every VS Code window its own colour. Put the API in Forest, the front end
in Ocean and the side project in Bordeaux, and when you switch between six open windows you
find the right one by colour.

Each project gets two picks:

- A **background** for the frame of the window: title bar, activity bar, status bar and
  tab strip. The editor, sidebars and terminal sit on it as darker panes in the same hue.
- An **accent** for buttons, badges, selections, the cursor and focus rings.

Syntax highlighting, diffs and error colours stay as Dark Modern draws them, so your code
looks the same in every project.

## 1,600 combinations, plus any hex

There are 40 backgrounds and 40 accents, and any background goes with any accent.

The backgrounds are 28 colours around the colour wheel (Cameo, Garnet, Ochre, Moss,
Lagoon, Sapphire, Plum and more), 10 muted tints such as Driftwood, Slate and Heather,
Graphite, which is the default, and Obsidian, which is pure black. A few deeper shades,
like Cordovan, Fathom, Lapis and Sumi, keep the panes close to the frame for a quieter
window.

The accents come in four kinds: saturated mid-tones like Cobalt, Jade and Carmine, dusty
ones like Madder, Bronze and Pewter, light pastels like Matcha, Peach and Periwinkle, and
pearls like Nacre and Opal. Snow turns the accent grey, and with Obsidian it gives a black
and white window.

Every background comes with an accent chosen to suit it, so one pick gives a finished
look. Choose a different accent to make the pair your own, or type any hex colour for
either one. Colours are kept soft: even a bright custom hex is toned down so nothing
glows, and text stays readable on all 1,600 pairs.

## Install

Themepane isn't on the Marketplace. It installs from its GitHub release with one command.

On Linux, macOS, WSL or Git Bash on Windows:

```bash
curl -fsSL https://raw.githubusercontent.com/pcardenal/themepane/main/install.sh | bash
```

The script finds VS Code and installs the latest release into it. If VS Code isn't
installed, it shows the command that gets it and offers to run it for you. From WSL it
installs into VS Code on Windows, so one install covers both local and WSL windows.

In Windows PowerShell:

```powershell
iwr https://github.com/pcardenal/themepane/releases/latest/download/themepane.vsix -OutFile $env:TEMP\themepane.vsix; code --install-extension $env:TEMP\themepane.vsix
```

Or download `themepane.vsix` from the
[latest release](https://github.com/pcardenal/themepane/releases/latest), open the
Extensions view in VS Code, click `…` and choose **Install from VSIX…**.

Reload open windows afterwards. Windows you haven't coloured use Graphite with Cobalt.

## Pick your colours

Click **Themepane** in the status bar, or run **Themepane: Pick Colours…**, then choose
**Background** or **Accent**. The arrow keys preview each colour on the window as you go,
and Esc puts the old one back. **Themepane: Pick Background…** and **Pick Accent…** open
one list directly.

**Linked to background**, at the top of the accents, goes back to the accent that comes
with the background. **Custom…** takes any hex colour, and **Reset to default** clears
both.

The status bar shows the background, such as **Forest**, and adds the accent when it isn't
the linked one, such as **Forest · Coral**.

## Where colours are saved

By default the colours go into the project's own settings: the `.code-workspace` file in a
workspace, or `.vscode/settings.json` for a folder opened on its own. They travel with the
project.

### Workspace only

`.vscode/settings.json` is often committed. If yours is, your teammates get your colours
too. To keep Themepane out of your repos, turn on **Workspace only** at the bottom of the
Themepane menu.

Themepane then never writes into a folder. A folder opened on its own gets a workspace
file beside it, at `<parent>/.workspaces/<folder>.code-workspace`, outside the repo where
git doesn't see it. **Reopen in workspace** switches the window to that file and opens the
picker there.

Until you reopen, the status bar reads **Themepane · Disabled** in yellow, and its tooltip
names the colours waiting in the workspace. Set `projectColor.reopenWorkspace` to `true` to
switch over automatically whenever that workspace already has colours.

**Reopen in workspace** is in the menu with Workspace only off too. It brings the folder's
current colours along.

## How it works

Every colour is a plain `workbench.colorCustomizations` setting on top of Dark Modern.
Themepane doesn't patch VS Code files, so VS Code updates can't break it. It works in local
and remote windows, including WSL. The default pair sits in your user settings, and each
project keeps its own.

Themepane is drawn for VS Code's modern layout: floating panes with rounded corners and
pill-shaped tabs. It turns both on in your user settings the first time it runs, and puts
back whatever you had when you uninstall it. Change them afterwards and your choice stays.

When a new version refines the palette, your projects pick up the new shades on the next
reload without you picking again.

If another extension or a settings block for your theme overrides Themepane's colours, the
status bar button turns yellow and reads **Themepane · Warning**, and the menu offers to
restore them. Themepane also suggests uninstalling theming extensions known to clash with
it, such as Peacock, each time a project opens, until you choose **Don't warn again**.

## Uninstall

Uninstall Themepane from the Extensions view, or with
`code --uninstall-extension pcardenal.themepane`. The next time VS Code starts, your layout
settings go back to what you had and the default colours leave your user settings, so
uncoloured windows return to plain Dark Modern. Each project keeps its own colours, and
they come back if you reinstall.

To remove every colour as well, run **Themepane: Clean Up and Uninstall…** instead. It
uninstalls Themepane and strips its colours and settings from your user settings (in
every profile), from every workspace VS Code remembers and from each remembered folder's
`.vscode/settings.json`. Everything else in those files stays as it was. Remote
workspaces the window can't reach, such as SSH or containers, are listed so you can clear
them by hand.
