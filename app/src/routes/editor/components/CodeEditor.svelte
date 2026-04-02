<script lang="ts">
    import { onMount } from 'svelte';

    import { EditorState } from '@codemirror/state';
    import {basicSetup, EditorView } from 'codemirror';
    import { openSearchPanel, highlightSelectionMatches } from '@codemirror/search';
    import { indentWithTab, history, defaultKeymap, historyKeymap } from '@codemirror/commands';
    import { foldGutter, indentOnInput, indentUnit, bracketMatching, foldKeymap, syntaxHighlighting, defaultHighlightStyle} from '@codemirror/language';
    import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
    import { lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, rectangularSelection, crosshairCursor, highlightActiveLine, keymap} from '@codemirror/view';
    import { lintGutter, setDiagnostics as cmSetDiagnostics, lintKeymap } from '@codemirror/lint';
    import type { Diagnostic } from '$lib/data/events/events.svelte';

    // Theme
    import { oneDark } from "@codemirror/theme-one-dark";
    
    // Language
    import { javascript } from '@codemirror/lang-javascript';
    import { settings } from '$lib/settings.svelte';

    let { code = $bindable() } = $props<{ code: string }>();

    let container: HTMLDivElement;
    let view: EditorView;

    export function clear() {
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: ""}
        });
    }

    export function showDiagnostics(diagnostics: Diagnostic[]) {
        const cmDiags = diagnostics.map(d => ({
            from: d.span.start,
            to: Math.max(d.span.start + 1, d.span.end),
            severity: d.severity.toLowerCase() as 'error' | 'warning' | 'info',
            message: d.message,
        }));
        view.dispatch(cmSetDiagnostics(view.state, cmDiags));
    }

    export function clearDiagnostics() {
        view.dispatch(cmSetDiagnostics(view.state, []));
    }

    let extensions = [
        basicSetup,
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        // foldGutter(),
        drawSelection(),
        indentUnit.of('\t'),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        lintGutter(),

        // These go together
        rectangularSelection(),
        crosshairCursor(),

        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
            indentWithTab,
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            ...lintKeymap,
        ]),

        // Language
        javascript(),
        syntaxHighlighting(defaultHighlightStyle, {fallback: true}),

        // React to internal changes
        EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                code = update.state.doc.toString();
            }
        })
    ];

    // React to external changes
    // This effect runs whenever the 'code' prop changes from the outside
    $effect(() => {
        if (view && code !== view.state.doc.toString()) {
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: code}
            });
        }
    });

    onMount(() => {
        const shadow = container.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = `
            :host { display: block; height: 100%; width: 100%; }
            .cm-editor { height: 100%; width: 100%; }
            .cm-scroller { overflow: auto; }
            .internal-wrapper { height: 100%; width: 100%; }
        `;
        shadow.appendChild(style);

        // Create a wrapper div for the CodeMirror editor
        const editorHost = document.createElement('div');
        editorHost.classList.add('internal-wrapper');
        shadow.appendChild(editorHost);

        // Update the theme if any
        if (settings.value.theme === 'dark') {
            extensions.push(oneDark);
            console.log(extensions);
        }

        view = new EditorView({
            state: EditorState.create({
                doc: code,
                extensions: [
                    extensions,
                ]
            }),
            parent: editorHost,
        });

        return () => view.destroy();
    });
</script>

<div class="editor-external-wrapper" bind:this={container}></div>

<style>
    .editor-external-wrapper {
        display: block;
    }
</style>