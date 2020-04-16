/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as cp from "child_process";
import { Uri, window, Disposable } from "vscode";
import { QuickPickItem } from "vscode";
import { workspace } from "vscode";

/**
 * A file opener using window.createQuickPick().
 *
 * It shows how the list of items can be dynamically updated based on
 * the user's input in the filter field.
 */

class FileItem implements QuickPickItem {
  label: string;
  description: string;

  constructor(public base: Uri, public uri: Uri) {
    this.label = path.basename(uri.fsPath);
    this.description = path.dirname(path.relative(base.fsPath, uri.fsPath));
  }
}

class MessageItem implements QuickPickItem {
  label: string;
  description = "";
  detail: string;

  constructor(public base: Uri, public message: string) {
    this.label = message.replace(/\r?\n/g, " ");
    this.detail = base.fsPath;
  }
}

export async function pickFile() {
  return await new Promise<string | undefined>((resolve, reject) => {
    const input = window.createQuickPick<QuickPickItem>();

    input.matchOnDetail = true;
    input.matchOnDescription = true;
    input.placeholder = "Type to search for files";
    input.onDidChangeValue((value) => {
      if (!value) {
        input.items = [];
        return;
      }
      input.busy = true;
      input.items = [];

      const cwds = workspace.workspaceFolders
        ? workspace.workspaceFolders.map((f) => f.uri.fsPath)
        : [process.cwd()];
      cwds.map((cwd) => {
        console.log("--------------");
        console.log(`fd --type f | fzf -f "${value}"`);
        const fzf = cp.spawn(`fd --type f | fzf -f "${value}"`, {
          cwd: cwd,
          shell: true,
        });

        fzf.stdout.on("data", (stdout: string) => {
          console.log(String(stdout));
          let items = String(stdout).split("\n");
          const files = items
            .filter((item) => item !== "")
            .slice(0, 50)
            .map((relative) => {
              return {
                alwaysShow: true,
                label: relative,
              };
            });
          console.log(files);
          input.items = input.items.concat(files);
        });
      });

      input.busy = false;
    });

    input.onDidChangeSelection((items) => {
      const item = items[0];
      resolve(item.label);

      input.hide();
    });

    input.show();
  });
}
