import './App.css';
import ReactFlow from 'react-flow-renderer';
import {useState} from "react";
import EdgeComponent from "./domains/EdgeComponent";
import NodeComponent from "./domains/NodeComponent";
import {message, Button, InputNumber, Space, Upload} from 'antd';
import 'antd/dist/antd.css';
import { UploadOutlined } from '@ant-design/icons';

const red = "red";
const gray = "gray";

const nodeStyle = (color) => {

    return {
        border: `3px solid ${color}`,
        borderRadius: "50%",
        width: `50px`,
        height: `50px`,
        position: "absolute",
        background: '#FFFFFF'
    }
};

const defaultNodeStyle = nodeStyle(gray);
const selectedNodeStyle = nodeStyle(red);

function createNode(id, x, y) {

    return {
        isDrag: false,
        id: id.toString(),
        selected: false,
        type: "special",
        style: defaultNodeStyle,
        position: {x: x, y: y}
    };
}

function createEdge(from, to, weigh) {

    return {
        id: `${from}-${to}`,
        source: from.toString(),
        target: to.toString(),
        label: weigh
    };
}

function getOutputStruct(state) {

    const elements = [];

    for (const i in state.nodes) {
        elements.push(state.nodes[i]);
    }

    for (const edge of state.edges) {
        elements.push(createEdge(edge.from, edge.to, edge.weigh));
    }

    return elements;
}

let nextNodeId = 1;
let userX = 0, userY = 0, userScale = 1;

function getSelectNodeIds(state) {

    const nodes = state.nodes;

    const selectedIds = [];

    for (const i in nodes) {

        if (nodes[i] && nodes[i].selected) {
            selectedIds.push(nodes[i].id);
        }
    }

    return selectedIds;
}

function isBlock(state) {

    let selectedIds = getSelectNodeIds(state);

    if (selectedIds.length !== 2) {
        return true;
    }

    return state[`${selectedIds[0]}-${selectedIds[1]}`] || state[`${selectedIds[1]}-${selectedIds[0]}`];
}

function App() {

    const [state, setState] = useState({
        nodes: {},
        edges: []
    });
    const [edgeWeigh, setEdgeWeigh] = useState(null);

    debugger;

    return (
        <>
            <div style={{
                width: "100%",
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                height: "100%"
            }}>
                <Space>
                    <Button type="primary" onClick={() => {

                        const nodes = state.nodes;

                        nodes[nextNodeId] = createNode(nextNodeId++, (-userX + (window.innerWidth / 2) - 300)/userScale, (-userY + (window.innerHeight / 2) - 200)/userScale);
                        setState(JSON.parse(JSON.stringify(state)));

                    }}>Add Node</Button>
                    <Button
                        type="primary"
                        disabled={isBlock(state)}
                        onClick={() => {

                            if (!edgeWeigh) {
                                message.error("Edge weigh can't be empty.");
                                return;
                            }

                            const nodes = state.nodes;

                            const selectedNodeIds = getSelectNodeIds(state);

                            const from = selectedNodeIds[0];
                            const to = selectedNodeIds[1];

                            state.edges.push({
                                from: from,
                                to: to,
                                weigh: edgeWeigh
                            });

                            nodes[from].selected = false;
                            nodes[to].selected = false;

                            nodes[from].style = defaultNodeStyle;
                            nodes[to].style = defaultNodeStyle

                            setState(JSON.parse(JSON.stringify(state)));

                        }}>Make Edge</Button>
                    <InputNumber
                        min={1}
                        value={edgeWeigh}
                        onChange={setEdgeWeigh}
                        placeholder="Edge Weigh"
                        style={{ width: '115px' }}
                    />
                    <Button
                        type="primary"
                        onClick={() => {

                            let text = "";
                            for (const edge of state.edges) {
                                text += `${edge.from} ${edge.to} ${edge.weigh}\n`;
                            }

                            const filename = "matrix.txt";
                            const blob = new Blob([text], {type: 'text/plain'});

                            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                                window.navigator.msSaveOrOpenBlob(blob, filename);
                            } else{
                                var e = document.createEvent('MouseEvents'),
                                    a = document.createElement('a');
                                a.download = filename;
                                a.href = window.URL.createObjectURL(blob);
                                a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
                                e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                                a.dispatchEvent(e);
                            }

                        }}>Save as matrix</Button>
                    <Button
                        type="primary"
                        onClick={() => {

                            const filename = "graph.json";
                            const blob = new Blob([JSON.stringify(state)], {type: 'text/plain'});

                            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                                window.navigator.msSaveOrOpenBlob(blob, filename);
                            } else{
                                var e = document.createEvent('MouseEvents'),
                                    a = document.createElement('a');
                                a.download = filename;
                                a.href = window.URL.createObjectURL(blob);
                                a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
                                e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                                a.dispatchEvent(e);
                            }

                        }}>Save as json</Button>
                    <Upload
                        showUploadList={false}
                        beforeUpload={file => {

                            file.text()
                                .then(text => {

                                    const newState = JSON.parse(text);

                                    for (const i in newState.nodes) {
                                        nextNodeId = Math.max(nextNodeId + 1, newState.nodes[i].id);
                                    }

                                    setState(newState);
                                });
                        }}><Button icon={<UploadOutlined />}>Load from json</Button></Upload>

                </Space>

                <ReactFlow
                    elements={getOutputStruct(state)}
                    edgeTypes={{default: EdgeComponent}}
                    nodeTypes={{special: NodeComponent}}
                    onNodeDrag={(e, node) => {
                        if (state.nodes[node.id]) {
                            debugger;
                            state.nodes[node.id].position.x = node.position.x;
                            state.nodes[node.id].position.y = node.position.y;
                        }
                    }}
                    onNodeDoubleClick={(e, node) => {

                        let elem = state.nodes[node.id];
                        if (elem) {

                            elem.selected = !elem.selected;

                            elem.style = elem.selected ? selectedNodeStyle : defaultNodeStyle;
                            setState(JSON.parse(JSON.stringify(state)));
                        }
                    }}
                    onMove={e => {
                        userX = e.x;
                        userY = e.y;
                        userScale = e.zoom;
                    }}
                />
            </div>
        </>
    );
}

export default App;
