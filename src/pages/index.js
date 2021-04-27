import React, {useCallback, useMemo, useState} from 'react'
import isHotkey from 'is-hotkey'
import {Editable, Slate, useSlate, withReact} from 'slate-react'
import {FaBold, FaCode, FaItalic, FaListOl, FaListUl, FaUnderline} from 'react-icons/fa';
import {MdFormatQuote, MdLooksOne, MdLooksTwo} from "react-icons/md";
import {createEditor, Editor, Element as SlateElement, Path, Range, Transforms,} from 'slate'
import {withHistory} from 'slate-history'


// import { inject } from "slate-react-dnd-plugin";
// import { DragPreviewBlock } from "slate-react-dnd-plugin";
// import { DragDropContainer } from "slate-react-dnd-plugin";
// import { DropBlock } from "slate-react-dnd-plugin";
import {DragDropContext, Draggable, Droppable} from 'react-beautiful-dnd';


const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,
    background: isDragging ? 'lightgreen' : 'grey',
    ...draggableStyle
});

const getListStyle = (isDraggingOver) => ({
    background: isDraggingOver ? 'lightblue' : 'lightgrey',
    padding: grid,
    width: 250
});
//end





const CustomButton = ({active, children, ...props}) => {
    return <button {...props} style={{ backgroundColor: active === true ? '#fff' : '#eee',marginBottom: "5px", marginRight: "5px" }}>{children}</button>
}

const Toolbar = ({children}) => {
    return <div style={{display: 'flex'}}>{children}</div>
}

const HOTKEYS = {
    'mod+b': 'bold',
    'mod+i': 'italic',
    'mod+u': 'underline',
    'mod+`': 'code',
}
const LIST_TYPES = ['numbered-list', 'bulleted-list']
const pageStyles = {
    color: "#232129",
    padding: 96,
    fontFamily: "-apple-system, Roboto, sans-serif, serif",
    display: "flex",
    justifyContent: "space-between"
}

const EditorStyles = {
    border: "1px solid #ccc",
    borderRadius:"2px",
    minHeight: "200px",
    padding: "8px"
}

const IndexPage = () => {
    const initialValue = [
        {
            type: 'paragraph',
            children: [
                {text: 'This is editable '},
                {text: 'rich', bold: true},
                {text: ' text, '},
                {text: 'much', italic: true},
                {text: ' better than a '},
                {text: '<textarea>', code: true},
                {text: '!'},
            ],
        },
        {
            type: 'paragraph',
            children: [
                {
                    text:
                        "Since it's rich text, you can do things like turn a selection of text ",
                },
                {text: 'bold', bold: true},
                {
                    text:
                        ', or add a semantically rendered block quote in the middle of the page, like this:',
                },
            ],
        },
        {
            type: 'block-quote',
            children: [{text: 'A wise quote.'}],
        },
        {
            type: 'paragraph',
            children: [{text: 'Try it out for yourself!'}],
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

    const BlockButton = ({format, icon}) => {
        const editor = useSlate()
        return (
            <CustomButton
                active={isBlockActive(editor, format)}
                onMouseDown={event => {
                    event.preventDefault()
                    toggleBlock(editor, format)
                }}
            >
                {icon === 'looks_one' ? <MdLooksOne></MdLooksOne> :
                    icon === 'looks_two' ? <MdLooksTwo></MdLooksTwo> :
                        icon === 'format_quote' ? <MdFormatQuote></MdFormatQuote> :
                            icon === 'format_list_numbered' ? <FaListOl></FaListOl> :
                                icon === 'format_list_bulleted' ? <FaListUl></FaListUl> : ''
                }
            </CustomButton>
        )
    }

    const MarkButton = ({format, icon}) => {
        const editor = useSlate()
        return (
            <CustomButton
                active={isMarkActive(editor, format)}
                onClick={event => {
                    event.preventDefault()
                    toggleMark(editor, format)
                }}
            >
                {icon === 'format_bold'
                    ? <FaBold></FaBold> : icon === 'format_italic'
                        ? <FaItalic></FaItalic> : icon === 'format_underlined'
                            ? <FaUnderline></FaUnderline> : icon === 'code'
                                ? <FaCode></FaCode> : ''}
            </CustomButton>
        )
    }

    const Element = ({attributes, children, element}) => {
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
            case 'inline':
                return <span {...attributes}>{children}</span>
            default:
                return <p {...attributes}>{children}</p>
        }
    }

    const Leaf = ({attributes, children, leaf}) => {
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
        const newProperties = {
            type: isActive ? 'paragraph' : isList ? 'list-item' : format,
        }
        Transforms.setNodes(editor, newProperties)

        if (!isActive && isList) {
            const block = {type: format, children: []}
            Transforms.wrapNodes(editor, block)
        }
    }

    const initialItems = [
        {id: `item1`, content: '<div>1</div>'},
        {id: `item2`, content: '<article>2</article>'},
        {id: `item3`, content: '<section>3</section>'},
        {id: `item4`, content: '<footer>4</footer>'},
        {id: `item5`, content: '<header>5</header>'},
    ];
    const [data, setData] = useState({items: initialItems});

    const id2List = {
        droppable: 'items'
    };

    const onDragEnd = (result) => {
        const { selection } = editor;
        const { source, destination } = result;
        if (!destination) {
            return;
        }
        let item = data.items.filter(i => {
            return i.id === result.draggableId;
        })[0];
        if (destination.droppableId === "droppable2") {
            if (!!selection) {

                const [parentNode, parentPath] = Editor.parent(
                    editor,
                    selection.focus?.path
                );

                if (editor.isVoid(parentNode)) {
                    Transforms.insertNodes(editor, { type: 'inline', children: [{text: item.content}]}, {
                        at: Path.next(parentPath),
                        select: true
                    });
                } else if (Range.isCollapsed(selection)) {
                    Transforms.insertNodes(editor, { type: 'inline', children: [{text: item.content}]}, { select: true });
                } else {
                    Transforms.wrapNodes(editor, { type: 'inline', children: [{text: item.content}]}, { split: true });
                    Transforms.collapse(editor, { edge: "end" });
                }
            }
            else {
                Transforms.insertNodes(editor, { type: 'inline', children: [{text: item.content}]});
            }
        }
    };


    return (
        <div className="wrapper" style={pageStyles}>
            <DragDropContext onDragEnd={onDragEnd}>
                <main className="richtext-editor" style={{width: '70%'}}>
                    <h1>Editor</h1>
                    <Droppable droppableId="droppable2">
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                >
                    <Slate
                        editor={editor}
                        value={value}
                        onChange={newValue => {
                            console.log(newValue)
                            setValue(newValue)
                        }}
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
                            style={EditorStyles}
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
                            </div>
                        )}
                    </Droppable>
                </main>


                <aside className="richtext-drag-and-drop-container" style={{width: '20%'}}>
                    <h1>Snippets</h1>

                    <Droppable droppableId="droppable">
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                style={getListStyle(snapshot.isDraggingOver)}>


                                {data.items.map((item, index) => (
                                    <Draggable
                                        key={item.id}
                                        draggableId={item.id}
                                        index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={getItemStyle(
                                                    snapshot.isDragging,
                                                    provided.draggableProps.style
                                                )}>
                                                {item.content}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}


                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>



                </aside>
            </DragDropContext>
        </div>
    )
}




export default IndexPage
