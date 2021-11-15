import {getBezierPath, getMarkerEnd, getEdgeCenter} from 'react-flow-renderer';
import {FolderOutlined} from "@ant-design/icons";

export default function CustomEdge({
                                       id,
                                       sourceX,
                                       sourceY,
                                       targetX,
                                       targetY,
                                       sourcePosition,
                                       targetPosition,
                                       style = {},
                                       label,
                                       data,
                                       arrowHeadType,
                                       markerEndId,
                                   }) {

    let sourceCenterX = sourceX;
    let sourceCenterY = sourceY + 25;

    let targetCenterX = targetX;
    let targetCenterY = targetY - 25;

    const isX = sourceCenterX > targetCenterX;
    const isY = sourceCenterY > targetCenterY;

    const isNonOriented = !data.isOriented;

    let progressNums = 0;

    let progressToPackets = {};

    for (let packet of data.packets) {

        if (packet.progress === 0) {
            continue;
        }

        if (packet.progress === packet.maxProgress) {
            continue;
        }

        if (id === `${packet.from}-${packet.to}`) {

            if (progressToPackets[packet.progress] === undefined) {
                progressToPackets[packet.progress] = [];
            }
            progressToPackets[packet.progress].push(packet);
            progressNums = packet.maxProgress;
        }

        if (!isNonOriented) {
            continue;
        }

        if (id === `${packet.to}-${packet.from}`) {

            if (progressToPackets[packet.progress] === undefined) {
                progressToPackets[packet.progress] = [];
            }
            progressToPackets[packet.progress].push(packet);
            progressNums = packet.maxProgress;
        }
    }

    let distX = Math.abs(Math.abs(sourceCenterX) - Math.abs(targetCenterX));
    let distY = Math.abs(Math.abs(sourceCenterY) - Math.abs(targetCenterY));

    let gip = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));

    let cos = distX / gip;

    let xDif = cos * 25;

    let yDif = Math.sqrt(Math.pow(25, 2) - Math.pow(xDif, 2));

    let x, y;
    if (!isNonOriented) {
        x = targetCenterX + ((isX ? xDif / 2 : -xDif) * 2.5) + (isY ? -yDif : yDif) * (1 / label.toString().length);
        y = targetCenterY + (isY ? yDif : -yDif * 2) + (isX ? xDif : -xDif);
    } else {
        [x, y] = getEdgeCenter({
            sourceX: sourceCenterX,
            sourceY: sourceCenterY,
            targetX: targetCenterX,
            targetY: targetCenterY
        });
    }

    let xDifference = (sourceCenterX - targetCenterX) / (progressNums);
    let yDifference = (sourceCenterY - targetCenterY) / (progressNums);

    let from = id.split("-")[0];

    let places = [];

    for (let progress in progressToPackets) {

        for (let i = 0; i < progressToPackets[progress].length; ++i) {

            let packet = progressToPackets[progress][i];

            if (packet.from === from) {
                places.push({
                    x: sourceCenterX - xDifference * packet.progress - 5 - (isX ? xDif : -xDif) * (i / progressToPackets[progress].length),
                    y: sourceCenterY - yDifference * packet.progress - 11 - (isY ? yDif : -yDif) * (i / progressToPackets[progress].length),
                    color: packet.color
                });
            } else {
                places.push({
                    x: targetCenterX + xDifference * packet.progress - 5 + (isX ? xDif : -xDif) * (i / progressToPackets[progress].length),
                    y: targetCenterY + yDifference * packet.progress - 11 + (isY ? yDif : -yDif) * (i / progressToPackets[progress].length),
                    color: packet.color
                })
            }
        }
    }

    const edgePath = getBezierPath({
        sourceX: sourceCenterX + (isX ? -xDif : xDif),
        sourceY: sourceCenterY + (isY ? -yDif : yDif),
        sourcePosition,
        targetX: targetCenterX + (isX ? xDif : -xDif),
        targetY: targetCenterY + (isY ? yDif : -yDif),
        targetPosition
    });
    const markerEnd = getMarkerEnd(isNonOriented ? null : arrowHeadType, markerEndId);

    let splitted = edgePath.split(" ");

    const black = "#000000";
    const gray = "rgba(185,185,185,0.24)";
    const yellow = "#FFF000";

    const color = data.isShowPath ? (data.isPath ? yellow : gray) : black;

    return (
        <>
            <path id={id}
                  style={{stroke: color}}
                  className="react-flow__edge-path"
                  d={splitted[0] + " " + splitted[splitted.length - 1]}
                  markerEnd={markerEnd}/>
            <foreignObject
                width={30}
                height={20}
                x={x}
                y={y}
                style={{
                    background: "rgba(71,34,34,0)",
                    color: color
                }}
                requiredExtensions="http://www.w3.org/1999/xhtml"
            >
                {label}
            </foreignObject>

            {
                places.map(place => {
                    return <foreignObject
                        width={50}
                        height={50}
                        x={place.x}
                        y={place.y}
                        style={{
                            background: "rgba(71,34,34,0)",
                            color: place.color
                        }}
                        requiredExtensions="http://www.w3.org/1999/xhtml"
                    >
                        <FolderOutlined width={50} height={50} />
                    </foreignObject>;
                })
            }
        </>
    );
}
