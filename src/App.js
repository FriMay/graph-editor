import './App.css';
import ReactFlow from 'react-flow-renderer';
import {useState} from "react";
import EdgeComponent from "./domains/EdgeComponent";
import NodeComponent from "./domains/NodeComponent";
import {message, notification, Button, InputNumber, Space, Upload, Input, Card, Divider} from 'antd';
import 'antd/dist/antd.css';
import {UploadOutlined} from '@ant-design/icons';
import calculate from "./domains/DijkstraAlgorithm";

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
        selectedAt: undefined,
        id: id.toString(),
        type: "special",
        style: defaultNodeStyle,
        position: {x: x, y: y}
    };
}

function createEdge(from, to, weigh, isPath = false) {

    return {
        id: `${from}-${to}`,
        source: from.toString(),
        target: to.toString(),
        style: {stroke: isPath ? "#FFF000" : "#000000"},
        label: weigh
    };
}

function getOutputStruct(state) {

    const elements = [];

    for (const i in state.nodes) {

        state.nodes[i].style = defaultNodeStyle;

        if (state.nodes[i].selectedAt) {
            state.nodes[i].style = selectedNodeStyle;
        }

        elements.push(state.nodes[i]);
    }

    for (const edge of state.edges) {
        elements.push(createEdge(edge.from, edge.to, edge.weigh, edge.isPath));
    }

    return elements;
}

let nextNodeId = 1;
let userX = 0, userY = 0, userScale = 1;

function getSelectNodes(state) {

    const nodes = state.nodes;

    const selected = [];

    for (const i in nodes) {

        if (nodes[i] && nodes[i].selectedAt) {
            selected.push(nodes[i]);
        }
    }

    selected.sort((a, b) => {

        if (a.selectedAt > b.selectedAt) {
            return 1;
        }

        return -1;
    })

    return selected;
}

function isBlock(state) {

    let selected = getSelectNodes(state);

    if (selected.length !== 2) {
        return true;
    }

    for (let edge of state.edges) {

        if ((edge.from === selected[0].id && edge.to === selected[1].id)
            || (edge.from === selected[1].id && edge.to === selected[0].id)) {
            return false;
        }
    }

    return true;
}

let isHaveResults = false;

function clearResults(state) {

    if (isHaveResults) {
        state.edges.forEach(edge => {
            edge.isPath = false;
        });
    }

    isHaveResults = false;
}

function App() {

    const [state, setState] = useState({
        nodes: {},
        edges: []
    });
    const [edgeWeigh, setEdgeWeigh] = useState(1);

    return (
        <>
            <div style={{
                width: "100%",
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                height: "100%"
            }}>
                <div style={{background: "rgba(217,255,147,0.66)"}}>
                    <Space>
                        <Button type="primary" onClick={() => {

                            clearResults(state);

                            getSelectNodes(state).forEach(node => {
                                node.selectedAt = undefined;
                            })

                            const nodes = state.nodes;

                            nodes[nextNodeId] = createNode(nextNodeId++, (-userX + (window.innerWidth / 2) - 300) / userScale, (-userY + (window.innerHeight / 2) - 200) / userScale);
                            setState(JSON.parse(JSON.stringify(state)));

                        }}>Add Node</Button>
                        <Button
                            type="primary"
                            disabled={getSelectNodes(state).length === 0}
                            onClick={() => {

                                clearResults(state);

                                const selectNodes = getSelectNodes(state);

                                selectNodes.forEach(node => {

                                    delete state.nodes[node.id];

                                    while (true) {

                                        let index = state.edges.findIndex(a => a.from === node.id || a.to === node.id);

                                        if (index < 0) {
                                            break;
                                        }

                                        state.edges.splice(index, 1);
                                    }
                                })

                                let indexes = [];

                                for (let i in state.nodes) {
                                    indexes.push(parseInt(i));
                                }

                                indexes.sort((a, b) => {

                                    if (a === b) {
                                        return 0;
                                    }

                                    if (a > b) {
                                        return 1;
                                    }

                                    return 0;
                                })

                                for (let i = 0; i < indexes.length; ++i) {

                                    const node = state.nodes[indexes[i]];

                                    const oldNodeId = node.id;
                                    const newNodeId = (i + 1).toString();

                                    node.id = newNodeId;

                                    delete state.nodes[oldNodeId];

                                    state.nodes[newNodeId] = node;

                                    state.edges.forEach(edge => {

                                        if (edge.from === oldNodeId) {
                                            edge.from = newNodeId;
                                        }

                                        if (edge.to === oldNodeId) {
                                            edge.to = newNodeId;
                                        }
                                    })
                                }

                                nextNodeId = indexes.length + 1;

                                setState(JSON.parse(JSON.stringify(state)));

                            }}>Delete Nodes</Button>
                        <Button
                            type="primary"
                            disabled={getSelectNodes(state).length !== 2}
                            onClick={() => {

                                clearResults(state);

                                if (!edgeWeigh) {
                                    message.error("Edge weigh can't be empty.");
                                    return;
                                }

                                debugger

                                const selectNodes = getSelectNodes(state);

                                const from = selectNodes[0];
                                const to = selectNodes[1];

                                let edge = state.edges.find(edge => (edge.from === from.id && edge.to === to.id) || (edge.to === from.id && edge.from === to.id));

                                if (edge) {
                                    edge.weigh = edgeWeigh;
                                } else {
                                    state.edges.push({
                                        from: from.id,
                                        to: to.id,
                                        weigh: edgeWeigh
                                    });
                                }

                                from.selectedAt = undefined;
                                to.selectedAt = undefined;

                                setState(JSON.parse(JSON.stringify(state)));

                            }}>Make Edge</Button>
                        <InputNumber
                            min={1}
                            value={edgeWeigh}
                            onChange={setEdgeWeigh}
                            placeholder="Edge Weigh"
                            style={{width: '115px'}}
                        />
                    </Space>
                    <br/><br/>
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => {

                                clearResults(state);

                                let text = "";
                                for (const edge of state.edges) {
                                    text += `${edge.from} ${edge.to} ${edge.weigh}\n`;
                                }

                                const filename = "matrix.txt";
                                const blob = new Blob([text], {type: 'text/plain'});

                                if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                                    window.navigator.msSaveOrOpenBlob(blob, filename);
                                } else {
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

                                clearResults(state);

                                const filename = "graph.json";
                                const blob = new Blob([JSON.stringify(state)], {type: 'text/plain'});

                                if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                                    window.navigator.msSaveOrOpenBlob(blob, filename);
                                } else {
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

                                        const newState = {
                                            nodes: {},
                                            edges: []
                                        }

                                        let x = window.innerWidth / 2
                                        let y = window.innerHeight / 2

                                        let isX = true;

                                        for (const line of text.split("\n")) {

                                            if (line.trim().length === 0) {
                                                continue;
                                            }

                                            const parts = line.replace("\n", "").split(" ");

                                            const from = parseInt(parts[0]);

                                            const to = parseInt(parts[1]);

                                            const weigh = parseInt(parts[2]);

                                            newState.nodes[from] = createNode(from, x, y);
                                            newState.nodes[to] = createNode(to, x - (isX ? 100 : 0), y - (!isX ? 100 : 0));
                                            newState.edges.push({
                                                from,
                                                to,
                                                weigh
                                            });

                                            nextNodeId = Math.max(from, to, nextNodeId);

                                            if (isX) {
                                                x += 100;
                                            } else {
                                                y += 100;
                                            }

                                            isX = !isX;
                                        }

                                        nextNodeId++;

                                        setState(newState);
                                    });
                            }}><Button icon={<UploadOutlined/>}>Load from matrix</Button></Upload>
                        <Upload
                            showUploadList={false}
                            beforeUpload={file => {

                                file.text()
                                    .then(text => {

                                        const newState = JSON.parse(text);

                                        for (const i in newState.nodes) {
                                            nextNodeId = Math.max(nextNodeId, newState.nodes[i].id);
                                        }

                                        nextNodeId++;

                                        setState(newState);
                                    });
                            }}><Button icon={<UploadOutlined/>}>Load from json</Button></Upload>
                    </Space>
                    <br/><br/>
                    <Space>
                        <Button
                            type="primary"
                            disabled={isBlock(state)}
                            onClick={() => {

                                clearResults(state);

                                if (!edgeWeigh) {
                                    message.error("Edge weigh can't be empty.");
                                    return;
                                }

                                debugger

                                const selectNodes = getSelectNodes(state);

                                const from = selectNodes[0];
                                const to = selectNodes[1];

                                let index = state.edges.findIndex(edge => (edge.from === from.id && edge.to === to.id) || (edge.to === from.id && edge.from === to.id));

                                if (index >= 0) {
                                    state.edges.splice(index, 1);
                                }

                                from.selectedAt = undefined;
                                to.selectedAt = undefined;

                                setState(JSON.parse(JSON.stringify(state)));

                            }}>Delete edge</Button>
                        <Button
                            type="primary"
                            disabled={getSelectNodes(state).length !== 2}
                            onClick={() => {

                                clearResults(state);

                                const selectNodes = getSelectNodes(state);

                                const from = selectNodes[0];
                                const to = selectNodes[1];

                                let [pathLength, path] = calculate(state, parseInt(from.id), parseInt(to.id));

                                if (path.length === 0) {
                                    notification.warn(
                                        {
                                            message: `Path from ${from.id} to ${to.id} doesn't exist.`,
                                            duration: 1000000
                                        }
                                    )
                                    return;
                                }

                                let textPath = `${path[path.length - 1].to}-${path[path.length - 1].from}`;
                                for (let i = path.length - 2; i > -1; --i) {
                                    textPath += `-${path[i].from}`;
                                }

                                notification.open(
                                    {
                                        message: `Short path from ${from.id} to ${to.id} was founded.`,
                                        description: `Shortest path: ${textPath}\nPath length: ${pathLength}`,
                                        duration: 1000000
                                    }
                                )

                                state.edges.forEach(edge => {

                                    for (let i of path) {

                                        let from = parseInt(edge.from);
                                        let to = parseInt(edge.to);

                                        if ((i.from === from && i.to === to)
                                            || (i.from === to && i.to === from)) {
                                            edge.isPath = true;
                                        }
                                    }
                                })

                                isHaveResults = true;

                                setState(JSON.parse(JSON.stringify(state)));

                            }}>Find optimal path by "Dijkstra's algorithm"</Button>
                    </Space>
                    <br/><br/>
                </div>

                <ReactFlow
                    elements={getOutputStruct(state)}
                    edgeTypes={{default: EdgeComponent}}
                    nodeTypes={{special: NodeComponent}}
                    onNodeDrag={(e, node) => {
                        if (state.nodes[node.id]) {
                            state.nodes[node.id].position.x = node.position.x;
                            state.nodes[node.id].position.y = node.position.y;
                        }
                    }}
                    onNodeDoubleClick={(e, node) => {

                        clearResults(state);

                        let selectNodes = getSelectNodes(state);

                        const selectNode = selectNodes.find((a) => a.id === node.id);

                        if (selectNodes.length > 1 && !selectNode) {
                            return;
                        }

                        let elem = state.nodes[node.id];
                        if (elem) {

                            if (selectNode) {
                                elem.selectedAt = undefined;
                            } else {
                                elem.selectedAt = Date.now();
                            }

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
