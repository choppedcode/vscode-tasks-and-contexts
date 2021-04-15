'use strict';

import * as vscode from 'vscode';

import { TasksTreeDataProvider, TaskTreeItem } from './tasksTreeDataProvider'

export function activate({ subscriptions }: vscode.ExtensionContext) {
	const tasksTreeDataProvider = new TasksTreeDataProvider(vscode.workspace.rootPath);

	vscode.window.registerTreeDataProvider('tasksAndContextsManager', tasksTreeDataProvider);
	vscode.commands.registerCommand('tasksAndContextsManager.refreshTasks', () => tasksTreeDataProvider.refreshTasks());
	vscode.commands.registerCommand('tasksAndContextsManager.activateTask', (taskName: string) => tasksTreeDataProvider.activateTask(taskName));
	vscode.commands.registerCommand('tasksAndContextsManager.addTask', () => tasksTreeDataProvider.addTask());
	vscode.commands.registerCommand('tasksAndContextsManager.addFromTrello', () => tasksTreeDataProvider.addFromTrello());
	vscode.commands.registerCommand('tasksAndContextsManager.editTask', (node: TaskTreeItem) => tasksTreeDataProvider.renameEntry(node));
	vscode.commands.registerCommand('tasksAndContextsManager.deleteTask', (node: TaskTreeItem) => tasksTreeDataProvider.deleteTask(node));

	vscode.workspace.onDidOpenTextDocument((document) => tasksTreeDataProvider.addDocument(document));

	tasksTreeDataProvider.taskStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	subscriptions.push(tasksTreeDataProvider.taskStatusBarItem);
}

function deactivate() { }
