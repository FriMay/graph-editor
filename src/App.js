import './App.css';
import ReactFlow, {ArrowHeadType} from 'react-flow-renderer';
import {useState} from "react";
import uuid from 'react-uuid';
import NodeComponent from "./domains/NodeComponent";
import {
    Button,
    Card,
    Col,
    Input,
    InputNumber,
    message,
    Modal,
    notification,
    Row,
    Select,
    Slider,
    Space,
    Upload
} from 'antd';
import 'antd/dist/antd.css';
import {UploadOutlined} from '@ant-design/icons';
import calculateDijkstra, {calculateAll} from "./domains/DijkstraAlgorithm";
import CustomEdge from "./domains/EdgeComponent";
import calculateFloyd from "./domains/FloydAlgorithm";
import MatrixTable from "./domains/MatrixTable";

const { TextArea } = Input;

const red = "red";
const gray = "gray";
const brown = "brown";

const { Option } = Select;

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
const pathNodeStyle = nodeStyle(brown);

function createNode(id, x, y) {

    return {
        isDrag: false,
        isPath: false,
        selectedAt: undefined,
        id: id.toString(),
        type: "special",
        style: defaultNodeStyle,
        position: {x: x, y: y}
    };
}

let progressNums = 10;
function createEdge(edge, isOriented, isShowPath, packets) {

    return {
        id: `${edge.from}-${edge.to}`,
        source: edge.from.toString(),
        target: edge.to.toString(),
        arrowHeadType: ArrowHeadType.ArrowClosed,
        label: edge.weigh,
        data: {isPath: edge.isPath, isOriented: isOriented, isShowPath, packets: packets, progressNums}
    };
}

function getOutputStruct(state, packets = []) {

    const elements = [];

    let isShowPath = state.edges.find(a => a.isPath) !== undefined;

    for (const i in state.nodes) {

        state.nodes[i].style = defaultNodeStyle;

        if (isShowPath) {

            if (state.nodes[i].isPath) {
                state.nodes[i].style = pathNodeStyle;
            } else {
                state.nodes[i].style = nodeStyle("rgba(185,185,185,0.24)");
            }
        }

        if (state.nodes[i].isAnimate) {
            state.nodes[i].style = pathNodeStyle;
        } else {
            if (state.nodes[i].selectedAt) {
                state.nodes[i].style = selectedNodeStyle;
            }
        }

        elements.push(state.nodes[i]);
    }

    let isEdgeAdded = {};
    for (const edge of state.edges) {

        const key = `${edge.from}-${edge.to}`;
        if (isEdgeAdded[key]) {
            continue;
        }

        isEdgeAdded[key] = true;

        let nonOrientedEdge = state.edges.find(a => a.weigh === edge.weigh && a.from === edge.to && a.to === edge.from);

        if (nonOrientedEdge) {
            isEdgeAdded[`${nonOrientedEdge.from}-${nonOrientedEdge.to}`] = true;
            edge.isPath = edge.isPath || nonOrientedEdge.isPath;
        }

        elements.push(createEdge(edge, !nonOrientedEdge, isShowPath, packets));
    }

    return elements;
}

let nextNodeId = 1;
let userX = 0, userY = 0, userScale = 1;

function getStateFromMatrix(currentState, text) {

    const newState = {
        nodes: {},
        edges: []
    }
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2

    let isX = true;

    nextNodeId = 0;
    let i = 1;
    for (const line of text.split("\n")) {
        if (line.trim().length === 0) {
            continue;
        }
        const parts = line.trim().replace("\n", "").split(" ");
        if (parts.length !== 3) {
            continue;
        }

        const from = parseInt(parts[0]);

        const to = parseInt(parts[1]);

        const weigh = parseInt(parts[2]);
        if (isNaN(from) || from < 0) {
            message.error(`Error when parse matrix in line ${i} (${line}). First argument should be positive number.`);
            return;
        }

        if (isNaN(to) || to < 0) {
            message.error(`Error when parse matrix in line ${i} (${line}). Second argument should be positive number.`);
            return;
        }

        if (isNaN(weigh) || weigh < 0) {
            message.error(`Error when parse matrix in line ${i} (${line}). Third argument should be positive number.`);
            return;
        }

        if (from === to) {
            message.error(`Error when parse matrix in line ${i} (${line}). First and second argument can't be equals.`)
            return;
        }

        if (newState.edges.find(a => a.from === parts[0] && a.to === parts[1])) {
            message.error(`Error when parse matrix in line ${i} (${line}). Edge ${from}-${to} already exist.`);
            return;
        }

        newState.nodes[from] = currentState.nodes[from] || createNode(from, x, y);
        newState.nodes[to] = currentState.nodes[to]
            || createNode(to, newState.nodes[from].position.x - 60, newState.nodes[from].position.y - 60);

        newState.edges.push({
            from: parts[0],
            to: parts[1],
            weigh
        });

        nextNodeId = Math.max(from, to, nextNodeId);

        if (isX) {
            x += 100;
        } else {
            y += 100;
        }
        isX = !isX;
        i++;
    }

    nextNodeId++;
    return newState;
}

function getTextFromState(state) {
    let text = "";
    for (const edge of state.edges) {
        text += `${edge.from} ${edge.to} ${edge.weigh}\n`;
    }
    return text;
}

function getTextPath(path) {

    let edges = [];
    let first = path[0];
    let textPath = `${path[0]}`;
    for (let i = 1; i < path.length; ++i) {

        let second = path[i];

        textPath += `-${second}`;

        edges.push({from: first, to: second});
        first = second;
    }
    return [edges, textPath];
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}

let packets = [];
let animationSpeed = 0;
let isStop = false;
function App() {

    const [state, setState] = useState({
        nodes: {},
        edges: []
    });
    const [edgeWeigh, setEdgeWeigh] = useState(1);
    const [matrixValue, setMatrixValue] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAnimation, setIsAnimation] = useState(false);
    const [method, setMethod] = useState("random");
    const [channelType, setChannelType] = useState("virtual");
    const [ttlCount, setTtlCount] = useState(100);
    const [packetsCount, setPacketsCount] = useState(3);
    const [isRoutingTableVisible, setIsRoutingTableVisible] = useState(false);
    const [routingTable, setRoutingTable] = useState({});

    const getSelectNodes = () => {

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

    const isBlock = () => {

        let selected = getSelectNodes();

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

    const clearEdges = () => {
        state.edges.forEach(edge => {
            edge.isPath = false;
        });
    }

    const clearResults = () => {

        packets = [];

        clearEdges();

        for (let i in state.nodes) {
            state.nodes[i].isPath = false;
            state.nodes[i].isAnimate = false;
        }
    }

    const calculateByFunc = (func, markPrefix, testCnt = 1000) => {

        const selectNodes = getSelectNodes();

        const from = selectNodes.length > 0 ? parseInt(selectNodes[0].id) : undefined;

        performance.mark(`${markPrefix}-start`)

        let paths;

        for (let i = 0; i < testCnt; ++i) {
            paths = func(state, from);
        }

        performance.mark(`${markPrefix}-end`)
        performance.measure(`${markPrefix}`, `${markPrefix}-start`, `${markPrefix}-end`)

        let measures = performance.getEntriesByType("measure");

        let end = (measures[measures.length - 1].duration / testCnt);

        return [paths, end];
    }

    const updateState = newState => setState(JSON.parse(JSON.stringify(newState)));

    const calc = (func, markPrefix) => {

        clearResults();

        const selectNodes = getSelectNodes();

        const from = parseInt(selectNodes[0].id);
        const to = parseInt(selectNodes[1].id);

        let [paths, time] = calculateByFunc(func, markPrefix);

        let shortPath = paths.find(a => a.path[0] === from && a.path[a.path.length - 1] === to);

        if (!shortPath) {
            notification.warn(
                {
                    message: `Path from ${from} to ${to} doesn't exist. Answered by ${time} millis.`,
                    duration: 1000000,
                    placement: 'bottomRight'
                }
            )
            return;
        }

        let path = shortPath.path;

        let [edges, textPath] = getTextPath(path);

        notification.open(
            {
                message: `Short path ${markPrefix} from ${from} to ${to} was founded by ${time} millis.`,
                description: `Shortest path: ${textPath}. Path length: ${shortPath.length}`,
                placement: 'bottomRight',
                duration: 1000000
            }
        )

        state.edges.forEach(stateEdge => {

            let from = parseInt(stateEdge.from);
            let to = parseInt(stateEdge.to);

            for (let edge of edges) {

                state.nodes[edge.from].isPath = true;
                state.nodes[edge.to].isPath = true;

                if ((edge.from === from && edge.to === to)) {
                    stateEdge.isPath = true;
                }
            }
        })

        updateState(state);
    }

    const isPathExist = () => {

        const selectNodes = getSelectNodes();

        const from = parseInt(selectNodes[0].id);
        const to = parseInt(selectNodes[1].id);

        let [paths] = calculateByFunc(calculateDijkstra, "Dijkstra", 1);

        return paths.find(a => a.path[0] === from && a.path[a.path.length - 1] === to && a.length);
    }

    const compareDijkstraAndFloyd = () => {

        let dijkstraIterator = 1;
        let floydIterator = 1;

        let [dijkstraPaths, dijkstraTime] = calculateByFunc(calculateAll, "Dijkstra");
        let [floydPaths, floydTime] = calculateByFunc(calculateFloyd, "Floyd");

        return <>
                <Row gutter={36}>
                    <Col span={10}>
                        <Card title={`Dijkstra Result: ${dijkstraTime} ms.`} bordered={false}>
                            {dijkstraPaths.map(shortPath => {
                                return <p>{dijkstraIterator++}) {getTextPath(shortPath.path)[1]}. Length: {shortPath.length}</p>;
                            })}
                        </Card>
                    </Col>

                    <Col span={10}>
                        <Card title={`Floyd Result: ${floydTime} ms.`} bordered={false}>
                            {floydPaths.map(shortPath => {
                                return <p>{floydIterator++}) {getTextPath(shortPath.path)[1]}. Length: {shortPath.length}</p>;
                            })}
                        </Card>
                    </Col>
                </Row>
            </>;
    }

    const sleep = speed => {
        return new Promise(resolve => setTimeout(resolve, 500 / Math.pow(2, speed)));
    }

    return (
        <>
            <div style={{
                width: "100%",
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                height: "100%"
            }}>
                <div style={{background: "rgba(217,255,147,0.66)"}}>
                    <TextArea style={{ zIndex: 1000, width:"300px", height: "160px", position: 'absolute', right: '0px'}}
                              value={matrixValue}
                              onChange={(text) => {

                                  setRoutingTable({});

                                  let newState = getStateFromMatrix(state, text.target.value);

                                  if (newState) {
                                      clearResults();
                                      setState(newState);
                                  }

                                  setMatrixValue(text.target.value);
                              }}
                    />
                    <Space>
                        <Button type="primary" onClick={() => {

                            setRoutingTable({});

                            clearResults(state);

                            getSelectNodes(state).forEach(node => {
                                node.selectedAt = undefined;
                            })

                            const nodes = state.nodes;

                            nodes[nextNodeId] = createNode(nextNodeId++, (-userX + (window.innerWidth / 2) - 300) / userScale, (-userY + (window.innerHeight / 2) - 200) / userScale);
                            updateState(state);

                        }}>Add Node</Button>
                        <Button
                            type="primary"
                            disabled={getSelectNodes(state).length === 0}
                            onClick={() => {

                                setRoutingTable({});

                                clearResults();

                                const selectNodes = getSelectNodes();

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

                                setMatrixValue(getTextFromState(state));
                                updateState(state);

                            }}>Delete Nodes</Button>
                        <Button
                            type="primary"
                            disabled={getSelectNodes(state).length !== 2}
                            onClick={() => {

                                setRoutingTable({});

                                clearResults();

                                if (!edgeWeigh) {
                                    message.error("Edge weigh can't be empty.");
                                    return;
                                }

                                const selectNodes = getSelectNodes();

                                const from = selectNodes[0];
                                const to = selectNodes[1];

                                let edge = state.edges.find(edge => (edge.from === from.id && edge.to === to.id));

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

                                setMatrixValue(getTextFromState(state));
                                updateState(state);

                            }}>Make oriented Edge</Button>
                        <InputNumber
                            min={1}
                            value={edgeWeigh}
                            onChange={setEdgeWeigh}
                            placeholder="Edge Weigh"
                            style={{width: '115px'}}
                        />
                        <Button
                            type="primary"
                            disabled={isBlock(state)}
                            onClick={() => {

                                setRoutingTable({});
                                clearResults(state);

                                if (!edgeWeigh) {
                                    message.error("Edge weigh can't be empty.");
                                    return;
                                }

                                const selectNodes = getSelectNodes(state);

                                const from = selectNodes[0];
                                const to = selectNodes[1];

                                let index = state.edges.findIndex(edge => (edge.from === from.id && edge.to === to.id));

                                if (index >= 0) {
                                    state.edges.splice(index, 1);
                                }

                                from.selectedAt = undefined;
                                to.selectedAt = undefined;

                                setMatrixValue(getTextFromState(state));
                                updateState(state);

                            }}>Delete edge</Button>
                    </Space>
                    <br/><br/>
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => {

                                setRoutingTable({});

                                clearResults();

                                let text = getTextFromState(state);

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

                                setRoutingTable({});

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

                                setRoutingTable({});

                                file.text()
                                    .then(text => {

                                        let newState = getStateFromMatrix(state, text);

                                        if (newState) {
                                            setState(newState);
                                        }
                                    });
                            }}><Button icon={<UploadOutlined/>}>Load from matrix</Button></Upload>
                        <Upload
                            showUploadList={false}
                            beforeUpload={file => {

                                setRoutingTable({});

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
                            disabled={getSelectNodes(state).length !== 2}
                            onClick={() => {

                                setRoutingTable({});

                                calc(calculateDijkstra, 'Dijkstra');

                            }}>Find optimal path by "Dijkstra's" algorithm</Button>
                        <Button
                            type="primary"
                            disabled={getSelectNodes(state).length !== 2}
                            onClick={() => {

                                setRoutingTable({});

                                calc(calculateFloyd, 'Floyd');

                            }}>Find optimal path by "Floyd's" algorithm</Button>
                        <Button
                            type="primary"
                            disabled={getSelectNodes(state).length !== 0 || state.edges.length === 0}
                            onClick={() => {
                                setRoutingTable({});

                                setIsModalVisible(true);

                            }}>Compare "Dijkstra" and "Floyd" algorithms</Button>
                        <Modal title="Comparison"
                               visible={isModalVisible}
                               onOk={() => setIsModalVisible(false)}
                               width={1100}
                               onCancel={() => setIsModalVisible(false)}>
                            {(getSelectNodes(state).length === 0 && state.edges.length !== 0) && isModalVisible ? compareDijkstraAndFloyd() : <></>}
                        </Modal>
                    </Space>
                    <br/><br/>
                    <Space>
                        <Select defaultValue={method} style={{ width: 200 }} onSelect={setMethod}>
                            <Option value="random">Random routing</Option>
                            <Option value="avalanche">Avalanche routing</Option>
                            <Option value="adaptive">Adaptive routing</Option>
                        </Select>
                        <Select defaultValue={channelType}
                                style={{ width: 200 }}
                                onSelect={setChannelType}
                                disabled={getSelectNodes(state).length !== 2 || isAnimation || !isPathExist()}>
                            <Option value="virtual">Virtual channel</Option>
                            <Option value="deitagramm">Deitagramm channel</Option>
                        </Select>
                        <InputNumber
                            min={1}
                            max={500}
                            value={ttlCount}
                            onChange={setTtlCount}
                            placeholder="TTL"
                            style={{width: '115px'}}
                        />
                        <InputNumber
                            min={1}
                            max={50}
                            value={packetsCount}
                            onChange={setPacketsCount}
                            placeholder="Packet count"
                            style={{width: '115px'}}
                        />

                        <Button
                            type="primary"
                            disabled={getSelectNodes(state).length !== 2 || isAnimation || !isPathExist()}
                            onClick={async () => {

                                setIsAnimation(true);

                                let [sourceNode, targetNode] = getSelectNodes();

                                clearResults();

                                updateState(state);

                                if (method === "random") {

                                    setRoutingTable({});

                                    for (let i = 0; i < packetsCount; ++i) {
                                        packets.push({
                                            from: sourceNode.id,
                                            to: sourceNode.id,
                                            progress: 0,
                                            maxProgress: 0,
                                            packetNumber: i + 1,
                                            ttl: ttlCount,
                                            currentTtl: 0,
                                            color: getRandomColor()
                                        });
                                    }

                                    while (!isStop && packets.length > 0) {

                                        let calculated = {};

                                        packets = packets.filter(p => p.progress !== p.maxProgress - 1 || state.edges.filter(a => a.from === p.to).length !== 0);
                                        packets = packets.filter(p => p.progress !== p.maxProgress || p.to !== targetNode.id);
                                        packets = packets.filter(p => p.currentTtl < p.ttl || p.progress !== p.maxProgress);

                                        if (packets.length === 0) {
                                            break;
                                        }

                                        for (let i = 0; i < packets.length; ++i) {

                                            let packet = packets[i];

                                            if (packet.progress === packet.maxProgress) {

                                                packet.progress = 1;

                                                const edges = state.edges.filter(a => a.from === packet.to);

                                                if (calculated[packet.from] === undefined) {
                                                    calculated[packet.from] = {};
                                                }

                                                if (calculated[packet.from][packet.to] === undefined) {
                                                    calculated[packet.from][packet.to] = edges[Math.floor(Math.random() * edges.length)];
                                                }

                                                let nextEdge = calculated[packet.from][packet.to];

                                                packet.from = packet.to;

                                                if (channelType !== "virtual") {
                                                    nextEdge = edges[Math.floor(Math.random() * edges.length)];
                                                }

                                                packet.to = nextEdge.to;
                                                packet.maxProgress = nextEdge.weigh + 2;
                                                packet.currentTtl += nextEdge.weigh;
                                            } else {
                                                packet.progress++;
                                            }
                                        }

                                        if (packets.length === 0) {
                                            break;
                                        }

                                        updateState(state);

                                        await sleep(animationSpeed);
                                    }

                                } else if (method === "avalanche") {

                                    setRoutingTable({});

                                    let isVirtual = channelType === "virtual";

                                    const edges = state.edges.filter(a => a.from === sourceNode.id);

                                    let nextEdge = edges[Math.floor(Math.random() * edges.length)];

                                    for (let i = 0; i < packetsCount; ++i) {

                                        let edge = isVirtual ? nextEdge : edges[Math.floor(Math.random() * edges.length)];

                                        packets.push({
                                            id: uuid(),
                                            from: sourceNode.id,
                                            to: edge.to,
                                            progress: 0,
                                            maxProgress: edge.weigh + 2,
                                            packetNumber: i + 1,
                                            ttl: ttlCount,
                                            currentTtl: edge.weigh,
                                            color: getRandomColor()
                                        });
                                    }

                                    let alreadyDelivered = {};

                                    while (!isStop) {

                                        packets
                                            .filter(p => p.progress === p.maxProgress && p.to === targetNode.id)
                                            .forEach(p => {
                                                alreadyDelivered[p.packetNumber] = true
                                            });

                                        let toDelete = {};

                                        packets
                                            .filter(p => p.currentTtl >= p.ttl && p.maxProgress === p.progress)
                                            .forEach(p => toDelete[p.id] = true);

                                        for (let delivered of packets.filter(a => a.progress === a.maxProgress)) {

                                            if (alreadyDelivered[delivered.packetNumber] !== undefined) {
                                                toDelete[delivered.id] = true;
                                                continue;
                                            }

                                            state.edges
                                                .filter(edge => edge.from === delivered.to && edge.to !== delivered.from)
                                                .forEach(nextEdge => {

                                                    packets.push({
                                                        id: uuid(),
                                                        from: delivered.to,
                                                        to: nextEdge.to,
                                                        progress: 0,
                                                        maxProgress: nextEdge.weigh + 2,
                                                        packetNumber: delivered.packetNumber,
                                                        ttl: delivered.ttl,
                                                        currentTtl: delivered.currentTtl + nextEdge.weigh,
                                                        color: delivered.color
                                                    });
                                                });
                                        }

                                        packets = packets.filter(a => a.progress !== a.maxProgress);

                                        packets = packets.filter(p => toDelete[p.id] === undefined);

                                        packets.forEach(packet => {
                                            packet.progress++;
                                        });

                                        if (packets.length === 0) {
                                            break;
                                        }

                                        updateState(state);

                                        await sleep(animationSpeed);
                                    }

                                } else {

                                    let routingTableLength = 0;

                                    for (let i in routingTable) {
                                        routingTableLength++;
                                    }

                                    let newRoutingTable = routingTable;

                                    if (routingTableLength === 0) {

                                        newRoutingTable = {};

                                        let nodeIds = [];
                                        for (let i in state.nodes) {
                                            nodeIds.push(i);
                                        }

                                        nodeIds = nodeIds.sort();

                                        for (let i of nodeIds) {

                                            newRoutingTable[i] = {};

                                            for (let j of nodeIds) {
                                                newRoutingTable[i][j] = null;
                                            }
                                        }
                                    }

                                    for (let i = 0; i < packetsCount; ++i) {
                                        packets.push({
                                            from: sourceNode.id,
                                            to: sourceNode.id,
                                            progress: 0,
                                            maxProgress: 0,
                                            packetNumber: i + 1,
                                            ttl: ttlCount,
                                            currentTtl: 0,
                                            color: getRandomColor()
                                        });
                                    }

                                    while (!isStop && packets.length > 0) {

                                        let calculated = {};

                                        packets
                                            .filter(p => p.progress === p.maxProgress)
                                            .forEach(p => {

                                                let currentValue = newRoutingTable[sourceNode.id][p.to] != null
                                                    ? newRoutingTable[sourceNode.id][p.to]
                                                    : Infinity;

                                                newRoutingTable[sourceNode.id][p.to] = Math.min(
                                                    currentValue,
                                                    p.currentTtl
                                                );
                                            });

                                        setRoutingTable(JSON.parse(JSON.stringify(newRoutingTable)));

                                        console.log("Routing table:");
                                        console.log(newRoutingTable);

                                        packets = packets.filter(p => p.progress !== p.maxProgress || state.edges.filter(a => a.from === p.to).length !== 0);
                                        packets = packets.filter(p => p.progress !== p.maxProgress || p.to !== targetNode.id);
                                        packets = packets.filter(p => p.currentTtl < p.ttl || p.progress !== p.maxProgress);

                                        if (packets.length === 0) {
                                            break;
                                        }

                                        for (let i = 0; i < packets.length; ++i) {

                                            let packet = packets[i];

                                            if (packet.progress === packet.maxProgress) {

                                                packet.progress = 1;

                                                const edges = state.edges.filter(a => a.from === packet.to);

                                                if (calculated[packet.from] === undefined) {
                                                    calculated[packet.from] = {};
                                                }

                                                if (calculated[packet.from][packet.to] === undefined) {
                                                    calculated[packet.from][packet.to] = edges[Math.floor(Math.random() * edges.length)];
                                                }

                                                let nextEdge = calculated[packet.from][packet.to];

                                                packet.from = packet.to;

                                                if (channelType !== "virtual") {
                                                    nextEdge = edges[Math.floor(Math.random() * edges.length)];
                                                }

                                                packet.to = nextEdge.to;
                                                packet.maxProgress = nextEdge.weigh + 2;
                                                packet.currentTtl += nextEdge.weigh;
                                            } else {
                                                packet.progress++;
                                            }
                                        }

                                        if (packets.length === 0) {
                                            break;
                                        }

                                        updateState(state);

                                        await sleep(animationSpeed);
                                    }
                                }

                                isStop = false;
                                setIsAnimation(false);

                                clearResults(state);

                                updateState(state);
                            }}
                        > Start </Button>
                        <Button
                            type="primary"
                            disabled={!isAnimation}
                            onClick={() => {
                                isStop = true;
                            }}>Stop</Button>
                        <Slider
                            marks={{
                                0: "1x",
                                1: "2x",
                                2: "4x",
                                3: "8x",
                                4: "16x"
                            }}
                            min={0}
                            max={4}
                            tipFormatter={null}
                            defaultValue={animationSpeed}
                            onChange={(value) => animationSpeed = value}
                            style={{width: "200px"}} />
                        <Button
                            type="primary"
                            onClick={() => {
                                setRoutingTable({});
                            }}>Clear routing table</Button>
                    </Space>
                    <br/><br/>
                </div>

                {
                    method !== 'adaptive'
                        ? <></>
                        : <MatrixTable
                            style={{ zIndex: 1000, position: 'absolute', right: '0px'}}
                            props={{state, routingTable }}
                        />
                }

                <ReactFlow
                    elements={getOutputStruct(state, packets)}
                    edgeTypes={{default: CustomEdge}}
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

                            updateState(state);
                        }
                    }}
                    onMove={e => {
                        userX = e.x;
                        userY = e.y;
                        userScale = e.zoom;
                    }}
                    props={state}
                />
            </div>
        </>
    );
}

export default App;
