import { Table } from 'antd';

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

export default function MatrixTable({
                                        props,
                                        style
                                    }) {

    let nodes = props.state.nodes;
    let routingTable = props.routingTable;

    let nodeIds = [];

    for (let id in nodes) {
        nodeIds.push(parseInt(id));
    }

    nodeIds = nodeIds.sort((a, b) => {
        return a - b;
    });

    const columns = [
        {
            title: '',
            dataIndex: 'rowNumber'
        }
    ];

    for (let id of nodeIds) {
        columns.push({
            title: `${id}`,
            dataIndex: `${id}`,
            render(text, record) {
                debugger;
                return {
                    props: {
                        style: { background: "rgba(0,254,255,0.19)" }
                    },
                    children: <div>{text}</div>
                };
            }
        })
    }

    let counter = 0;

    const data = [];

    for (let rowId of nodeIds) {

        let temp = {
            key: `${counter++}`,
            rowNumber: `${rowId}`
        };

        for (let columnId of nodeIds) {
            if (routingTable[rowId] != null && routingTable[rowId][columnId] != null) {
                temp[columnId] = routingTable[rowId][columnId];
            } else {
                temp[columnId] = '-';
            }
        }

        data.push(temp);
    }

    let styleCopy = clone(style);

    let length = 5;

    if (data.length > 5) {
        length = data.length;
    }

    styleCopy.width = `${length * 50}px`;
    styleCopy.height = styleCopy.width;
    styleCopy.color = '#FFFAAA';

    return (
        <>
            {
                data.length === 0
                    ? <></>
                    : <Table
                        columns={columns}
                        dataSource={data}
                        pagination={false}
                        bordered={true}
                        size="big"
                        title={() => <div>'Routing table'</div>}
                        style={styleCopy}
                    />
            }
        </>
    );
}
