/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as cp from "child_process";
import { Uri, window, Disposable } from "vscode";
import { QuickPickItem } from "vscode";
import { workspace } from "vscode";

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
                // TODO: Remove this once VS Code stops enforcing it's own filtering
                // REF: https://github.com/microsoft/vscode/issues/73904
                alwaysShow: true,
                label: relative,
              };
            });
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
