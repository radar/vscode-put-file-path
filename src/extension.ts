// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { pickFile } from "./pickFile";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "workspace-files.findFile",
    async () => {
      const file = await pickFile();
      if (file) {
        let path = file.path;
        const pathParts = path.split("/");
        const workDirPos = pathParts.indexOf("ticketee");

        path = pathParts.slice(workDirPos + 1).join("/");

        const currentPosition =
          vscode.window.activeTextEditor?.selection.active;

        if (currentPosition) {
          vscode.window.activeTextEditor?.edit((editBuilder) => {
            editBuilder.insert(currentPosition, path);
          });
        }
      }
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
