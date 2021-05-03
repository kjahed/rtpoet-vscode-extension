'use strict';

import * as path from 'path';
import * as os from 'os';

import {Trace} from 'vscode-jsonrpc';
import { commands, window, workspace, ExtensionContext, Uri } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient';

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
        if (activeEditor && activeEditor.document && activeEditor.document.languageId === 'rt')
            commands.executeCommand("rt.prtgen", activeEditor.document.uri.toString())
    }));

    context.subscriptions.push(commands.registerCommand("rt.cppgen.proxy", async () => {
        let activeEditor = window.activeTextEditor;
        if (activeEditor && activeEditor.document && activeEditor.document.languageId === 'rt')
            commands.executeCommand("rt.cppgen", activeEditor.document.uri.toString())
    }));

    context.subscriptions.push(commands.registerCommand("rt.jsongen.proxy", async () => {
        let activeEditor = window.activeTextEditor;
        if (activeEditor && activeEditor.document && activeEditor.document.languageId === 'rt')
            commands.executeCommand("rt.jsongen", activeEditor.document.uri.toString())
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