import {getBezierPath, getMarkerEnd, getEdgeCenter} from 'react-flow-renderer';

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

    let xDif = 0, yDif = 0;
    let x, y;
    if (!isNonOriented) {

        let distX = Math.abs(Math.abs(sourceCenterX) - Math.abs(targetCenterX));
        let distY = Math.abs(Math.abs(sourceCenterY) - Math.abs(targetCenterY));

        let gip = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));

        let cos = distX / gip;

        xDif = cos * 25;

        yDif = Math.sqrt(Math.pow(25, 2) - Math.pow(xDif, 2));

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
                    zIndex: data.isPath ? 100000 : 999,
                    background: "rgba(71,34,34,0)",
                    color: color
                }}
                requiredExtensions="http://www.w3.org/1999/xhtml"
            >
                {label}
            </foreignObject>
        </>
    );
}
