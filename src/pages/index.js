import '../scss/style.scss'
import React, {useCallback, useMemo, useState} from 'react'
import isHotkey from 'is-hotkey'
import {Editable, Slate, useSlate, withReact} from 'slate-react'

import {FaBold, FaCode, FaItalic, FaListOl, FaListUl, FaUnderline} from 'react-icons/fa';
import {MdFormatQuote, MdLooksOne, MdLooksTwo} from "react-icons/md";


import {createEditor, Editor, Element as SlateElement, Transforms,} from 'slate'

import {withHistory} from 'slate-history'

const CustomButton = ({active, children}) => {
  return <button className={active === true ? 'active': ''}>{children}</button>
}


const Toolbar = ({children}) => {
  return <div style={{display: 'flex' }}>{children}</div>
}


const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
}

const LIST_TYPES = ['numbered-list', 'bulleted-list']
// styles
const pageStyles = {
  color: "#232129",
  padding: 96,
  fontFamily: "-apple-system, Roboto, sans-serif, serif",
}


const IndexPage = () => {
  const initialValue = [
    {
      type: 'paragraph',
      children: [
        { text: 'This is editable ' },
        { text: 'rich', bold: true },
        { text: ' text, ' },
        { text: 'much', italic: true },
        { text: ' better than a ' },
        { text: '<textarea>', code: true },
        { text: '!' },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          text:
              "Since it's rich text, you can do things like turn a selection of text ",
        },
        { text: 'bold', bold: true },
        {
          text:
              ', or add a semantically rendered block quote in the middle of the page, like this:',
        },
      ],
    },
    {
      type: 'block-quote',
      children: [{ text: 'A wise quote.' }],
    },
    {
      type: 'paragraph',
      children: [{ text: 'Try it out for yourself!' }],
    },
  ]

  const [value, setValue] = useState(initialValue)
  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])



  const isMarkActive = (editor, format) => {
    const marks = Editor.marks(editor)
    return marks ? marks[format] === true : false
  }

  const toggleMark = (editor, format) => {
    const isActive = isMarkActive(editor, format)

    if (isActive) {
      Editor.removeMark(editor, format)
    } else {
      Editor.addMark(editor, format, true)
    }
  }


  const BlockButton = ({ format, icon }) => {
    const editor = useSlate()
    return (
        <CustomButton
            active={isBlockActive(editor, format)}
            onMouseDown={event => {
              event.preventDefault()
              toggleBlock(editor, format)
            }}
        >
          { icon ===  'looks_one' ? <MdLooksOne></MdLooksOne> :
              icon===  'looks_two' ? <MdLooksTwo></MdLooksTwo> :
                  icon===  'format_quote' ? <MdFormatQuote></MdFormatQuote>:
                      icon === 'format_list_numbered' ? <FaListOl></FaListOl> :
            icon === 'format_list_bulleted' ? <FaListUl></FaListUl> : ''
          }
        </CustomButton>
    )
  }

  const MarkButton = ({ format, icon }) => {
    const editor = useSlate()
    return (
        <CustomButton
            active={isMarkActive(editor, format)}
            onMouseDown={event => {
              event.preventDefault()
              toggleMark(editor, format)
            }}
        >
          {icon === 'format_bold'
              ? <FaBold></FaBold> : icon=== 'format_italic'
                  ? <FaItalic></FaItalic> : icon=== 'format_underlined'
                  ? <FaUnderline></FaUnderline>: icon ==='code'
                  ? <FaCode></FaCode> : ''}
        </CustomButton>
    )
  }


  const Element = ({ attributes, children, element }) => {
    switch (element.type) {
      case 'block-quote':
        return <blockquote {...attributes}>{children}</blockquote>
      case 'bulleted-list':
        return <ul {...attributes}>{children}</ul>
      case 'heading-one':
        return <h1 {...attributes}>{children}</h1>
      case 'heading-two':
        return <h2 {...attributes}>{children}</h2>
      case 'list-item':
        return <li {...attributes}>{children}</li>
      case 'numbered-list':
        return <ol {...attributes}>{children}</ol>
      default:
        return <p {...attributes}>{children}</p>
    }
  }

  const Leaf = ({ attributes, children, leaf }) => {
    if (leaf.bold) {
      children = <strong>{children}</strong>
    }

    if (leaf.code) {
      children = <code>{children}</code>
    }

    if (leaf.italic) {
      children = <em>{children}</em>
    }

    if (leaf.underline) {
      children = <u>{children}</u>
    }

    return <span {...attributes}>{children}</span>
  }

  const isBlockActive = (editor, format) => {
    const [match] = Editor.nodes(editor, {
      match: n =>
          !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })

    return !!match
  }

  const toggleBlock = (editor, format) => {
    const isActive = isBlockActive(editor, format)
    const isList = LIST_TYPES.includes(format)

    Transforms.unwrapNodes(editor, {
      match: n =>
          LIST_TYPES.includes(
              !Editor.isEditor(n) && SlateElement.isElement(n) && n.type
          ),
      split: true,
    })
    const newProperties= {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    }
    Transforms.setNodes(editor, newProperties)

    if (!isActive && isList) {
      const block = { type: format, children: [] }
      Transforms.wrapNodes(editor, block)
    }
  }

  return (
    <main style={pageStyles}>
      <h1>Editor</h1>

      <Slate
          editor={editor}
          value={value}
          onChange={newValue => setValue(newValue)}
      >


        <Toolbar>
          <MarkButton format="bold" icon="format_bold"/>
          <MarkButton format="italic" icon="format_italic"/>
          <MarkButton format="underline" icon="format_underlined"/>
          <MarkButton format="code" icon="code"/>
          <BlockButton format="heading-one" icon="looks_one"/>
          <BlockButton format="heading-two" icon="looks_two"/>
          <BlockButton format="block-quote" icon="format_quote"/>
          <BlockButton format="numbered-list" icon="format_list_numbered"/>
          <BlockButton format="bulleted-list" icon="format_list_bulleted"/>
        </Toolbar>


        <Editable
            className="Editor"
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder="Enter some rich text…"
            onKeyDown={event => {
              for (const hotkey in HOTKEYS) {
                if (isHotkey(hotkey, event)) {
                  event.preventDefault()
                  const mark = HOTKEYS[hotkey]
                  toggleMark(editor, mark)
                }
              }
            }}
        />

      </Slate>

    </main>
  )
}

export default IndexPage
