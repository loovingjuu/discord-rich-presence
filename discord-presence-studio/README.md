# Discord Presence Studio

A small desktop application for managing your personal Discord Rich Presence. It uses **Electron** for the desktop UI, **Node.js** for the main process, and **`@xhayper/discord-rpc`** to communicate with the Discord desktop app.

> This is not a Discord bot. It does not use a bot token, does not need to be invited to a server, and does not create bot commands.

## Features

- Connect to the Discord desktop application with your Discord Application ID.
- Apply a custom activity with a **Details** line and a **State** line.
- Use the built-in Coding, Gaming, Studying, and Chilling presets.
- Edit the activity text before applying it.
- Set optional large and small Rich Presence image asset keys and hover text.
- Preview the activity text locally in the app.
- Clear the current Rich Presence without closing the app.
- Keep the older terminal version available through `npm run start:cli` (if `src/index.js` is still present).

The preview is a local approximation, not an exact copy of Discord's profile UI. The final display depends on Discord and the assets configured for your application.

## Requirements

- Windows 10 or 11 (other desktop platforms may work with Electron and the RPC library, but this project is primarily documented for Windows).
- Node.js 20 or newer.
- npm (included with Node.js).
- Git, if you want to push the project to GitHub.
- Discord desktop app installed, open, and signed in.
- A Discord Application ID from the Discord Developer Portal.

Discord in a browser tab is not sufficient for local RPC. Keep the desktop app running while using Presence Studio.

## 1. Create a Discord application

1. Open <https://discord.com/developers/applications>.
2. Sign in and select **New Application**.
3. Give the application a name. This is the app identity associated with the Rich Presence.
4. Open **General Information** and copy the **Application ID**.
5. You do not need to create a bot, generate a bot token, or invite anything to a server.

Do not confuse the Application ID with a bot token, client secret, or public key.

## 2. Open the project folder

Open the project root in VS Code. The root is the folder containing `package.json`, not the parent folder that contains the project folder.

For example, if the project is located here:

```text
C:\Users\YOUR_USER\Downloads\discord-presence\discord-presence-studio
```

then the VS Code terminal must be in that `discord-presence-studio` folder.

You can move to it in PowerShell with:

```powershell
cd "$HOME\Downloads\discord-presence\discord-presence-studio"
```

Check that you are in the correct place:

```powershell
Get-Location
Get-ChildItem
```

You should see `package.json`, `src`, and `ui` in the listing.

## 3. Install dependencies

Install the Discord RPC library and Electron from the project root:

```powershell
npm install @xhayper/discord-rpc@1.5.1
npm install --save-dev electron
```

If the project already has those dependencies installed, this step does not need to be repeated every time.

### Configure the npm scripts

The GUI uses `src/main.js` as its Electron entry point. Run these commands once from the project root:

```powershell
npm pkg set main="src/main.js"
npm pkg set "scripts.start=electron ."
npm pkg set "scripts.start:cli=node src/index.js"
```

The resulting `package.json` should contain the equivalent of these important fields (the exact dependency versions may differ based on what npm installed):

```json
{
  "main": "src/main.js",
  "scripts": {
    "start": "electron .",
    "start:cli": "node src/index.js"
  }
}
```

Keep the `dependencies` and `devDependencies` that npm writes to `package.json`. Do not replace the entire file with only the small example above.

## 4. Configure `config.json`

The Electron main process creates `config.json` with default values the first time it runs if the file is missing. Open `config.json` in the project root and enter your Application ID:

```json
{
  "clientId": "YOUR_DISCORD_APPLICATION_ID",
  "largeImageKey": "",
  "largeImageText": "Still writing my life story",
  "smallImageKey": "",
  "smallImageText": "Software Engineering"
}
```

Replace `YOUR_DISCORD_APPLICATION_ID` with the numeric Application ID from the Developer Portal. Save the file before connecting.

The GUI also lets you enter the Application ID in the Connection section. The app saves the ID to `config.json` after a successful connection.

`config.json` is a local settings file and should not be committed to Git. The repository should contain `config.example.json` with placeholder values instead.

## 5. Run the desktop app

1. Open and sign in to the Discord desktop app.
2. In VS Code, open the project root terminal.
3. Run:

   ```powershell
   npm start
   ```

4. The Presence Studio desktop window should open.
5. Enter your Application ID in the **Discord desktop** section and select **Connect Discord**.
6. Choose a preset or edit **Details** and **State** manually.
7. Optionally open **Artwork settings** and enter the asset keys uploaded to your Discord application.
8. Select **Apply activity** to publish the Rich Presence.
9. Select **Clear presence** to remove it.

The timer in the local preview starts when you apply an activity. Closing the app clears the activity when the RPC connection is still available.

## 6. Add custom artwork (optional)

1. Open your application in the Discord Developer Portal.
2. Find the **Rich Presence** / **Art Assets** section (the exact navigation label may change).
3. Upload the images you want to use.
4. Copy the asset keys exactly as shown in the portal.
5. In Presence Studio, open **Artwork settings** and enter the large and/or small image key.
6. Add optional hover text, then select **Apply activity** again.

An empty image key is valid. The activity can work with text only.

## 7. Run the older terminal version (optional)

If `src/index.js` is still included and you want to use the earlier menu-based version instead of the GUI, run:

```powershell
npm run start:cli
```

The normal `npm start` command launches the Electron GUI.

## Project structure

```text
discord-presence-studio/
├── src/
│   ├── main.js           # Electron main process and Discord RPC controller
│   ├── preload.js        # Safe bridge between the UI and main process
│   ├── index.js           # Older terminal version (optional)
│   └── presets.js        # Presets for the older terminal version (optional)
├── ui/
│   ├── index.html        # Desktop UI structure
│   ├── style.css         # UI styling
│   └── renderer.js       # UI interactions and local preview
├── config.json           # Local configuration; do not commit
├── config.example.json   # Example configuration with placeholders
├── .gitignore            # Excludes local config and generated dependencies
├── package.json          # Project metadata, scripts, and dependencies
├── package-lock.json     # Exact dependency lockfile; commit this file
└── README.md             # Project documentation
```

## Troubleshooting

### `npm error Missing script: "start"`

The `start` script is missing from `package.json`, or the terminal is in the wrong folder. From the project root, run:

```powershell
npm pkg set "scripts.start=electron ."
npm start
```

### `Cannot find package.json`

The terminal is probably in the parent folder. Use `Get-Location` and `Get-ChildItem`, then `cd` into the folder that actually contains `package.json`.

### `config.json` is missing

Run `npm start` from the project root; the current GUI main process creates a default config file if it does not exist. Then enter the Application ID in the GUI and connect. If your local `main.js` does not include automatic config creation, copy `config.example.json` to `config.json` instead:

```powershell
Copy-Item .\config.example.json .\config.json
```

### Application ID is invalid

Copy the Application ID from **General Information** in the Developer Portal. Do not paste a bot token, client secret, or public key.

### Discord connection fails

- Open the Discord desktop app and make sure you are signed in.
- Do not use Discord in a browser as the RPC host.
- Check that the Application ID is correct.
- Close and reopen Discord, then retry the connection.

### Artwork does not appear

Check that the image key exactly matches an asset uploaded to the same Discord application. Try applying the activity again after correcting the key.

### Activity is not visible to friends

Check Discord's Activity Privacy settings and the relevant activity-sharing settings for your account.

## Git and GitHub: commit and push changes

This section explains how to publish the source code to a GitHub repository. Run the commands from the project root (the folder containing `package.json`).

### Before the first push

1. Create a new, empty repository on <https://github.com/new>.
2. Give it a name, for example `discord-presence-studio`.
3. For the easiest first push, do not initialize the GitHub repository with a README, `.gitignore`, or license because this project already has its own files.
4. Copy the repository's HTTPS URL. It will look like:

   ```text
   https://github.com/YOUR_USERNAME/discord-presence-studio.git
   ```

5. Make sure `.gitignore` contains at least:

   ```gitignore
   node_modules/
   config.json
   .env
   *.log
   dist/
   release/
   out/
   ```

   Keep `config.example.json` in Git. Do not add your local `config.json` or `node_modules` folder.

### Initialize Git and make the first push

If this folder has not been initialized as a Git repository yet, run:

```powershell
git init
git branch -M main
git add .
git status
git commit -m "feat: create Discord Presence Studio GUI"
git remote add origin https://github.com/YOUR_USERNAME/discord-presence-studio.git
git push -u origin main
```

Replace the remote URL with the HTTPS URL of your own GitHub repository. Review the output of `git status` before committing. Confirm that `config.json` and `node_modules` are not listed among the files to be committed.

If Git asks you to identify yourself, configure the name and email you want attached to your commits:

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Use an email address associated with your GitHub account if you want GitHub to attribute the commit to that account.

### Push updates after the first push

After editing code or the README, use this workflow:

```powershell
git status
git add .
git status
git commit -m "describe the change"
git push
```

For example:

```powershell
git add .
git commit -m "style: refine desktop interface"
git push
```

`git add .` stages the project changes, `git commit` saves a local snapshot, and `git push` uploads your committed changes to GitHub. Review `git status` before committing so you do not accidentally include local configuration or generated files.

### If `origin` is already configured

Do not run `git remote add origin` a second time. Check the existing remote:

```powershell
git remote -v
```

If it points to the wrong repository, replace it:

```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/discord-presence-studio.git
```

Then push:

```powershell
git push -u origin main
```

### If Git says there is nothing to commit

That means Git does not see any new staged changes. Check the files you edited and run:

```powershell
git status
```

### Git safety checklist

- Commit source files, `README.md`, `package.json`, and `package-lock.json`.
- Keep `config.json`, `.env`, and `node_modules` out of the repository.
- Never put a bot token, client secret, password, or other credential in source code or README files.
- Do not use `git push --force` as a routine fix. Check the branch and remote first.

## License

No license has been added yet. Until a license is chosen, treat reuse and redistribution as requiring the author's permission.
