'use strict';

import * as vscode from 'vscode';

import { TasksTreeDataProvider, TaskTreeItem } from './tasksTreeDataProvider'

export function activate(context: vscode.ExtensionContext) {
	const tasksTreeDataProvider = new TasksTreeDataProvider(vscode.workspace.rootPath);

	vscode.window.registerTreeDataProvider('taskManager', tasksTreeDataProvider);
	vscode.commands.registerCommand('taskManager.refreshTasks', () => tasksTreeDataProvider.refreshTasks());
	vscode.commands.registerCommand('taskManager.activateTask', (taskName: string) => tasksTreeDataProvider.activateTask(taskName));
	vscode.commands.registerCommand('taskManager.addTask', () => tasksTreeDataProvider.addTask());
	vscode.commands.registerCommand('taskManager.addFromTrello', () => tasksTreeDataProvider.addFromTrello());
	vscode.commands.registerCommand('taskManager.editTask', (node: TaskTreeItem) => tasksTreeDataProvider.renameEntry(node));
	vscode.commands.registerCommand('taskManager.deleteTask', (node: TaskTreeItem) => tasksTreeDataProvider.deleteTask(node));

	vscode.workspace.onDidOpenTextDocument((document) => tasksTreeDataProvider.addDocument(document));

	/**
	 * onDidCloseTextDocument only gets triggered when the document gets disposed of, 
	 * which can take up to 3 minutes after closing the tab. This causes inconsistencies when switching repeatedly between
	 * tasks that contain the same documents.
	 * As an alternative, the document must be removed via the 'Remove From Task' editor menu link.
	 */

	// vscode.workspace.onDidCloseTextDocument((document) => tasksTreeDataProvider.removeDocument(document));

	vscode.commands.registerCommand('taskManager.removeDocumentFromTask', (document) => tasksTreeDataProvider.removeDocumentFromTask(document));
}

function deactivate() {}
