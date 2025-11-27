<script lang="ts">
  /**
   * Monaco Editor Component
   * Wraps Monaco editor for prompt editing
   */
  import { onMount, onDestroy } from "svelte";
  import loader from "@monaco-editor/loader";
  import type * as Monaco from "monaco-editor";

  // Props
  export let value: string = "";
  export let language: string = "markdown";
  export let theme: string = "vs-dark";
  export let readOnly: boolean = false;
  export let placeholder: string = "Enter your prompt...";
  let className: string = "";
  export { className as class };

  // Event handlers
  export let onChange: ((value: string) => void) | undefined = undefined;
  export let onRunShortcut: (() => void) | undefined = undefined;
  export let onEditorMount:
    | ((editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => void)
    | undefined = undefined;

  let editorContainer: HTMLDivElement;
  let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  let monaco: typeof Monaco | null = null;

  onMount(async () => {
    // Load Monaco
    monaco = await loader.init();

    if (!editorContainer) return;

    // Configure Monaco theme
    monaco.editor.defineTheme("vibeforge-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0b0f17",
        "editor.foreground": "#f8fafc",
        "editorLineNumber.foreground": "#64748b",
        "editor.selectionBackground": "#fbbf2440",
        "editor.inactiveSelectionBackground": "#fbbf2420",
        "editorCursor.foreground": "#fbbf24",
        "editor.lineHighlightBackground": "#1e293b",
        "editorWidget.background": "#0b0f17",
        "editorWidget.border": "#233044",
      },
    });

    // Create editor
    editor = monaco.editor.create(editorContainer, {
      value,
      language,
      theme: "vibeforge-dark",
      readOnly,
      fontSize: 14,
      fontFamily:
        "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace",
      lineHeight: 22,
      padding: { top: 16, bottom: 16 },
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      automaticLayout: true,
      lineNumbers: "on",
      glyphMargin: false,
      folding: true,
      renderLineHighlight: "line",
      scrollbar: {
        vertical: "auto",
        horizontal: "auto",
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: true,
      },
    });

    // Handle changes
    editor.onDidChangeModelContent(() => {
      if (editor && onChange) {
        onChange(editor.getValue());
      }
    });

    // Add Cmd+Enter keybinding for run shortcut
    if (onRunShortcut) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRunShortcut();
      });
    }

    // Show placeholder if empty
    if (!value && placeholder) {
      showPlaceholder();
    }

    // Call onEditorMount callback if provided
    if (onEditorMount && editor && monaco) {
      onEditorMount(editor, monaco);
    }
  });

  function showPlaceholder() {
    if (!monaco || !editor) return;

    const placeholderNode = document.createElement("div");
    placeholderNode.className = "monaco-placeholder";
    placeholderNode.style.cssText = `
      position: absolute;
      top: 16px;
      left: 80px;
      color: #64748b;
      pointer-events: none;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 14px;
      line-height: 22px;
    `;
    placeholderNode.textContent = placeholder;

    const container = editorContainer.querySelector(".monaco-editor");
    if (container) {
      container.appendChild(placeholderNode);

      // Remove placeholder when content is added
      editor.onDidChangeModelContent(() => {
        if (editor && editor.getValue()) {
          placeholderNode.remove();
        }
      });
    }
  }

  // Update value externally
  $: if (editor && value !== editor.getValue()) {
    editor.setValue(value);
  }

  // Update language
  $: if (editor && monaco) {
    const model = editor.getModel();
    if (model && language !== model.getLanguageId()) {
      monaco.editor.setModelLanguage(model, language);
    }
  }

  // Update readOnly
  $: if (editor) {
    editor.updateOptions({ readOnly });
  }

  onDestroy(() => {
    editor?.dispose();
  });
</script>

<div
  bind:this={editorContainer}
  class="monaco-editor-container w-full {className}"
/>

<style>
  .monaco-editor-container {
    position: relative;
    overflow: hidden;
  }

  :global(.monaco-placeholder) {
    opacity: 0.5;
  }
</style>
