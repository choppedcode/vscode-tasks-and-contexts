'use strict';

import * as vscode from 'vscode';

import { TasksTreeDataProvider, TaskTreeItem } from './tasksTreeDataProvider'

export function activate({ subscriptions }: vscode.ExtensionContext) {
	const tasksTreeDataProvider = new TasksTreeDataProvider(vscode.workspace.rootPath);

	vscode.window.registerTreeDataProvider('taskManager', tasksTreeDataProvider);
	vscode.commands.registerCommand('taskManager.refreshTasks', () => tasksTreeDataProvider.refreshTasks());
	vscode.commands.registerCommand('taskManager.activateTask', (taskName: string) => tasksTreeDataProvider.activateTask(taskName));
	vscode.commands.registerCommand('taskManager.addTask', () => tasksTreeDataProvider.addTask());
	vscode.commands.registerCommand('taskManager.addFromTrello', () => tasksTreeDataProvider.addFromTrello());
	vscode.commands.registerCommand('taskManager.editTask', (node: TaskTreeItem) => tasksTreeDataProvider.renameEntry(node));
	vscode.commands.registerCommand('taskManager.deleteTask', (node: TaskTreeItem) => tasksTreeDataProvider.deleteTask(node));

	vscode.workspace.onDidOpenTextDocument((document) => tasksTreeDataProvider.addDocument(document));

	tasksTreeDataProvider.taskStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	subscriptions.push(tasksTreeDataProvider.taskStatusBarItem);
}

function deactivate() { }
