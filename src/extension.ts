'use strict';

import * as path from 'path';
import * as os from 'os';

import {Trace} from 'vscode-jsonrpc';
import { commands, window, workspace, ExtensionContext, Uri, ProgressLocation } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient';
import { time } from 'console';

export function activate(context: ExtensionContext) {
    // The server is a locally installed in src/rt
    let launcher = os.platform() === 'win32' ? 'ca.jahed.rtpoet.dsl.ide.bat' : 'ca.jahed.rtpoet.dsl.ide';
    let script = context.asAbsolutePath(path.join('src', 'rt', 'bin', launcher));

    let serverOptions: ServerOptions = {
        run : { command: script },
        debug: { command: script, args: [], options: { env: createDebugEnv() } }
    };
    
    let clientOptions: LanguageClientOptions = {
        documentSelector: ['rt'],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/*.*')
        }
    };

    context.subscriptions.push(commands.registerCommand("rt.prtgen.proxy", async () => {
        let activeEditor = window.activeTextEditor;
        if (activeEditor && activeEditor.document && activeEditor.document.languageId === 'rt') {
            window.withProgress({
                location: ProgressLocation.Notification,
                title: "Generating PapyrusRT Model",
                cancellable: false
            }, async (progress, token) => {
                let result: {[key: string]: any} = await commands.executeCommand("rt.prtgen", activeEditor.document.uri.toString())

                if(result.error) {
                    window.showErrorMessage("Error generating PapyrusRT model: " + result.message);
                } else {
                    window.showInformationMessage("PapyrusRT model generated", "Open")
                    .then(selection => {
                        if (selection === "Open") {
                            commands.executeCommand("vscode.open", Uri.file(result.path));
                        }
                    });
                }

                return new Promise<void>(resolve => {
                    resolve();
                });
            });
        }
    }));

    context.subscriptions.push(commands.registerCommand("rt.cppgen.proxy", async () => {
        let activeEditor = window.activeTextEditor;
        if (activeEditor && activeEditor.document && activeEditor.document.languageId === 'rt') {
            window.withProgress({
                location: ProgressLocation.Notification,
                title: "Generating C++ Code",
                cancellable: false
            }, async (progress, token) => {
                let result: {[key: string]: any} = await commands.executeCommand("rt.cppgen", activeEditor.document.uri.toString());

                if(result.error) {
                    window.showErrorMessage("Error generating C++ code: " + result.message);
                } else {
                    window.showInformationMessage("C++ code generated", "Open in Terminal")
                    .then(selection => {
                        if (selection === "Open in Terminal") {
                            const terminal = window.createTerminal("Generated C++ Code");
                            terminal.sendText("cd " + result.path);
                            terminal.show();
                        }
                    });
                }

                return new Promise<void>(resolve => {
                    resolve();
                });
            });
        }
    }));

    context.subscriptions.push(commands.registerCommand("rt.jsgen.proxy", async () => {
        let activeEditor = window.activeTextEditor;
        if (activeEditor && activeEditor.document && activeEditor.document.languageId === 'rt') {
            window.withProgress({
                location: ProgressLocation.Notification,
                title: "Generating JS Code",
                cancellable: false
            }, async (progress, token) => {
                let result: {[key: string]: any} = await commands.executeCommand("rt.jsgen", activeEditor.document.uri.toString(), 
                    workspace.getConfiguration("rtpoet").get("js.inspector"));
                
                if(result.error) {
                    window.showErrorMessage("Error generating JS code: " + result.message);
                } else {
                    window.showInformationMessage("JS code generated", "Open in Terminal")
                    .then(selection => {
                        if (selection === "Open in Terminal") {
                            const terminal = window.createTerminal("Generated JS Code");
                            terminal.sendText("cd " + result.path);
                            terminal.show();
                        }
                    });
                }

                return new Promise<void>(resolve => {
                    resolve();
                });
            });
        }
    }));

    context.subscriptions.push(commands.registerCommand("rt.rtgen.proxy", async () => {
        let activeEditor = window.activeTextEditor;
        if (activeEditor && activeEditor.document && activeEditor.document.fileName.endsWith('.uml')) {
            window.withProgress({
                location: ProgressLocation.Notification,
                title: "Generating Textual Model",
                cancellable: false
            }, async (progress, token) => {
                let result: {[key: string]: any} = await commands.executeCommand("rt.rtgen", activeEditor.document.uri.toString());

                if(result.error) {
                    window.showErrorMessage("Error generating textual model: " + result.message);
                } else {
                    window.showInformationMessage("Textual model generated", "Open")
                    .then(selection => {
                        if (selection === "Open") {
                            commands.executeCommand("vscode.open", Uri.file(result.path));
                        }
                    });
                }

                return new Promise<void>(resolve => {
                    resolve();
                });
            });
        }
    }));

    context.subscriptions.push(commands.registerCommand("rt.devcontainergen.proxy", async () => {
        window.withProgress({
            location: ProgressLocation.Notification,
            title: "Generating Devcontainer",
            cancellable: false
        }, async (progress, token) => {
            let result: {[key: string]: any} = await commands.executeCommand("rt.devcontainergen");

            if(result.error) {
                window.showErrorMessage("Error generating devcontainer: " + result.message);
            } else {
                window.showInformationMessage("Devcontainer generated", "Open project in container")
                .then(selection => {
                    if (selection === "Open project in container") {
                        commands.executeCommand("remote-containers.rebuildAndReopenInContainer");
                    }
                });
            }

            return new Promise<void>(resolve => {
                resolve();
            });
        });
        
    }));
    
    if(!process.env["UMLRTS_ROOT"])
        context.environmentVariableCollection.replace("UMLRTS_ROOT", path.join(context.extensionPath, "src", "devcontainer", "umlrts"));

    context.subscriptions.push(commands.registerCommand("rt.buildrts", async () => {
        const terminal = window.createTerminal("Build UMLRTS-RTS");
        terminal.sendText("cd $UMLRTS_ROOT && make");
        terminal.show();
    }));

    let lc = new LanguageClient('rtpoet', 'RTPoet Language Server', serverOptions, clientOptions);
    // enable tracing (.Off, .Messages, Verbose)
    lc.trace = Trace.Verbose;
    let disposable = lc.start();
    
    // Push the disposable to the context's subscriptions so that the 
    // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);
}

function createDebugEnv() {
    return Object.assign({
        JAVA_OPTS:"-Xdebug -Xrunjdwp:server=y,transport=dt_socket,address=8000,suspend=n,quiet=n"
    }, process.env)
}