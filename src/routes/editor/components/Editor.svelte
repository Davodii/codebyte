<script lang="ts">
    import { onMount } from 'svelte';

    import { EditorState } from '@codemirror/state';
    import {basicSetup, EditorView } from 'codemirror';
    import { openSearchPanel, highlightSelectionMatches } from '@codemirror/search';
    import { indentWithTab, history, defaultKeymap, historyKeymap } from '@codemirror/commands';
    import { foldGutter, indentOnInput, indentUnit, bracketMatching, foldKeymap, syntaxHighlighting, defaultHighlightStyle} from '@codemirror/language';
    import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
    import { lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, keymap} from '@codemirror/view';

    // Theme
    import { oneDark } from "@codemirror/theme-one-dark";
    
    // Language
    import { javascript } from '@codemirror/lang-javascript';

    let editorDiv: HTMLDivElement;

    onMount(() => {
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
            ]),

            // Language
            javascript(),
            syntaxHighlighting(defaultHighlightStyle, {fallback: true}),

            // Theme
            // oneDark,
        ];

        const startState = EditorState.create({
            doc: "console.log('hello!');",
            extensions: [
                extensions,
                // EditorView.updateListener.of(update => {
                //     if (update.docChanged) {
                //         onChange(update.state.doc.toString());
                //     }
                // })
            ]
        });

        const view = new EditorView({
            state: startState,
            parent: editorDiv,
        });

        return () => view.destroy();
    });
</script>

<div class="editor" bind:this={editorDiv}></div>

<style>
    .editor {
        flex-grow: 1;
        min-height: 0;
        overflow: hidden;
        height: 100%;
    }

    :global(.cm-editor) {
        height: 100%;
        width: 100%;
    }

    :global(.cm-scroller) {
        overflow:auto;
    }
</style>