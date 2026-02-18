import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TiptapUnderline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Youtube from '@tiptap/extension-youtube';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo, Minus, Video,
  Upload, Download, Highlighter, Subscript as SubIcon, Superscript as SupIcon,
  Sparkles, Loader2, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      TiptapLink.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing your article...' }),
      TiptapUnderline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Youtube.configure({
        inline: false,
        ccLanguage: 'en',
        interfaceLanguage: 'en',
        allowFullscreen: true,
        HTMLAttributes: {
          class: 'youtube-embed rounded-xl overflow-hidden my-4',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose-content min-h-[400px] p-4 focus:outline-none',
      },
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addYoutubeVideo = useCallback(() => {
    const url = window.prompt('Enter YouTube video URL');
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 });
    }
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const exportJSON = useCallback(() => {
    if (!editor) return;
    const json = editor.getJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'article-content.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported!');
  }, [editor]);

  const importJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        editor.commands.setContent(json);
        onChange(editor.getHTML());
        toast.success('JSON imported!');
      } catch {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [editor, onChange]);

  const handleAI = useCallback(async (action: string) => {
    if (!editor) return;
    const html = editor.getHTML();
    if (!html || html === '<p></p>') {
      toast.error('Write some content first');
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-article', {
        body: { content: html, action },
      });
      if (error) throw error;
      if (data?.result) {
        editor.commands.setContent(data.result);
        onChange(data.result);
        toast.success('AI applied successfully!');
      }
    } catch (err: any) {
      toast.error(err.message || 'AI failed');
    } finally {
      setAiLoading(false);
    }
  }, [editor, onChange]);

  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={importJSON} />
      
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
        <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()} aria-label="Bold">
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic">
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} aria-label="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()} aria-label="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('highlight')} onPressedChange={() => editor.chain().focus().toggleHighlight().run()} aria-label="Highlight">
          <Highlighter className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('subscript')} onPressedChange={() => editor.chain().focus().toggleSubscript().run()} aria-label="Subscript">
          <SubIcon className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('superscript')} onPressedChange={() => editor.chain().focus().toggleSuperscript().run()} aria-label="Superscript">
          <SupIcon className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Toggle size="sm" pressed={editor.isActive('heading', { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} aria-label="Heading 1">
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading 2">
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('heading', { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="Heading 3">
          <Heading3 className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet list">
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Ordered list">
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} aria-label="Blockquote">
          <Quote className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('codeBlock')} onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()} aria-label="Code block">
          <Code className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Toggle size="sm" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => editor.chain().focus().setTextAlign('left').run()} aria-label="Align left">
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => editor.chain().focus().setTextAlign('center').run()} aria-label="Align center">
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => editor.chain().focus().setTextAlign('right').run()} aria-label="Align right">
          <AlignRight className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive({ textAlign: 'justify' })} onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()} aria-label="Justify">
          <AlignJustify className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button type="button" variant="ghost" size="sm" onClick={setLink} className="h-8 px-2">
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={addImage} className="h-8 px-2">
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={addYoutubeVideo} className="h-8 px-2" title="Insert YouTube Video">
          <Video className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="h-8 px-2">
          <Minus className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 px-2" title="Import JSON">
          <Upload className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={exportJSON} className="h-8 px-2" title="Export JSON">
          <Download className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="h-8 px-2">
          <Undo className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="h-8 px-2">
          <Redo className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* AI Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={aiLoading}>
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              AI
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleAI('improve')}>✨ Improve Writing</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAI('fix_grammar')}>📝 Fix Grammar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAI('make_professional')}>💼 Make Professional</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAI('shorten')}>✂️ Shorten</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAI('expand')}>📖 Expand</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAI('translate_en')}>🇬🇧 Translate to English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAI('translate_id')}>🇮🇩 Translate to Indonesian</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
