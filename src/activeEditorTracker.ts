// Adapted from eamodio.restore-editors v0.2.1

'use strict';
import { commands, Disposable, TextEditor, window } from 'vscode';

export type BuiltInCommands = 'vscode.open' | 'setContext' | 'workbench.action.closeActiveEditor' | 'workbench.action.nextEditor';
export const BuiltInCommands = {
    CloseActiveEditor: 'workbench.action.closeActiveEditor' as BuiltInCommands,
    NextEditor: 'workbench.action.nextEditor' as BuiltInCommands
};

export class ActiveEditorTracker extends Disposable {

    private _disposable: Disposable;
    private _resolver: ((value?: TextEditor | PromiseLike<TextEditor>) => void) | undefined;

    constructor() {
        super(() => this.dispose());

        this._disposable = window.onDidChangeActiveTextEditor(e => this._resolver && this._resolver(e));
    }

    dispose() {
        this._disposable && this._disposable.dispose();
    }

    async awaitClose(timeout: number = 500): Promise<TextEditor> {
        this.close();
        return this.wait(timeout);
    }

    async awaitNext(timeout: number = 500): Promise<TextEditor> {
        this.next();
        return this.wait(timeout);
    }

    async close(): Promise<{} | undefined> {
        return commands.executeCommand(BuiltInCommands.CloseActiveEditor);
    }

    async next(): Promise<{} | undefined> {
        return commands.executeCommand(BuiltInCommands.NextEditor);
    }

    async wait(timeout: number = 500): Promise<TextEditor> {
        const editor = await new Promise<TextEditor>((resolve, reject) => {
            let timer: any;

            this._resolver = (editor: TextEditor) => {
                if (timer) {
                    clearTimeout(timer as any);
                    timer = 0;
                    resolve(editor);
                }
            };

            timer = setTimeout(() => {
                resolve(window.activeTextEditor);
                timer = 0;
            }, timeout) as any;
        });
        this._resolver = undefined;
        return editor;
    }
}

