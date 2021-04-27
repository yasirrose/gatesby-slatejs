import {DragDropContext, Draggable, Droppable} from 'react-beautiful-dnd';
import {createEditor, Editor, Element as SlateElement, Path, Range, Transforms} from 'slate'

import React, {useCallback, useMemo, useState} from 'react'

import isHotkey from 'is-hotkey'
import {Editable, Slate, useSlate, withReact} from 'slate-react'
import {FaBold, FaCode, FaItalic, FaListOl, FaListUl, FaUnderline} from 'react-icons/fa';
import {MdFormatQuote, MdLooksOne, MdLooksTwo} from "react-icons/md";
import {withHistory} from 'slate-history'

const EditorStyles = {
    border: "1px solid #ccc",
    borderRadius:"2px",
    minHeight: "200px",
    padding: "8px"
}
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

const getItems = (count, offset = 0) =>
    Array.from({ length: count }, (v, k) => k).map((k) => ({
        id: `item-${k + offset}`,
        content: `<span>item ${k + offset}</span>`
    }));

const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

const move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);
    destClone.splice(droppableDestination.index, 0, removed);
    const result = {};
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;
    return result;
};

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

const EditorComponent  = () => {

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

    const [data, setData] = useState({ items: getItems(10), selected: getItems(5, 10) });

    const id2List = {
        droppable: 'items',
        droppable2: 'selected'
    };

    const getList = (id) => data[id2List[id]];

    const onDragEnd = (result) => {
        // editor.insertInline('This is Wrong');
        // editor.insertBlock({
        //     type: 'paragraph',
        //     children: [{text: 'A wise quote.'}],
        // });
        const { selection } = editor;


        // editor.change(change => change.insertFragment('A wise quote.'));


        if (!!selection) {
            const [parentNode, parentPath] = Editor.parent(
                editor,
                selection.focus?.path
            );

            // if (parentNode.type === "link") {
            //     removeLink(editor);
            // }

            if (editor.isVoid(parentNode)) {
                Transforms.insertNodes(editor, { type: 'inline', children: [{text: '<span>A wise quote.</span>'}]}, {
                    at: Path.next(parentPath),
                    select: true
                });
            } else if (Range.isCollapsed(selection)) {
                Transforms.insertNodes(editor, { type: 'inline', children: [{text: '<span>A wise quote.</span>'}]}, { select: true });
            } else {
                Transforms.wrapNodes(editor, { type: 'inline', children: [{text: '<span>A wise quote.</span>'}]}, { split: true });
                Transforms.collapse(editor, { edge: "end" });
            }
        } else {
            Transforms.insertNodes(editor, { type: 'inline', children: [{text: '<span>A wise quote.</span>'}]});
        }


        console.log(editor);
        const { source, destination } = result;

        console.log(result);

        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            const items = reorder(
                getList(source.droppableId),
                source.index,
                destination.index
            );

            let state = { items };

            if (source.droppableId === 'droppable2') {
                setData({...data, selected: items})
            }
        } else {
            const result = move(
                getList(source.droppableId),
                getList(destination.droppableId),
                source,
                destination
            );
            setData({
                items: result.droppable,
                selected: result.droppable2
            });
        }
    };

        return (
            <DragDropContext onDragEnd={onDragEnd}>
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

                <Droppable droppableId="droppable2">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}>

                            <Slate
                                editor={editor}
                                value={value}
                                onChange={newValue => {
                                    console.log(newValue)
                                    setValue(newValue)
                                }}
                            >
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
                                    onDrop={event => {
                                        console.log(event);
                                    }}
                                />
                            </Slate>

                        </div>
                    )}
                </Droppable>

            </DragDropContext>
        );
}

export default EditorComponent;
