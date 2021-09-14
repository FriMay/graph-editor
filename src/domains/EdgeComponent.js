import { getBezierPath, getMarkerEnd, getEdgeCenter } from 'react-flow-renderer';

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

    let distX = Math.abs(Math.abs(sourceCenterX) - Math.abs(targetCenterX));
    let distY = Math.abs(Math.abs(sourceCenterY) - Math.abs(targetCenterY));

    let gip = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));

    let cos = distX / gip;

    let xDif = cos * 25;

    let yDif = Math.sqrt(Math.pow(25, 2) - Math.pow(xDif, 2));

    const isX = sourceCenterX > targetCenterX;
    const isY = sourceCenterY > targetCenterY;

    const edgePath = getBezierPath({
        sourceX: sourceCenterX + (isX ? -xDif : xDif),
        sourceY: sourceCenterY + (isY ? -yDif : yDif),
        sourcePosition,
        targetX: targetCenterX + (isX ? xDif : -xDif),
        targetY: targetCenterY + (isY ? yDif : -yDif),
        targetPosition
    });
    const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);

    let splitted = edgePath.split(" ");

    debugger;

    return (
        <>
            <path id={id}
                  style={{stroke: data.isPath ? "#FFF000" : "#000000"}}
                  className="react-flow__edge-path"
                  d={splitted[0] + " " + splitted[splitted.length-1]}
                  markerEnd={markerEnd} />
            <foreignObject
                width={30}
                height={20}
                x={targetCenterX + ((isX ? xDif/2 : -xDif) * 2.5) + (isY ? -yDif : yDif ) * (1 / label.toString().length)}
                y={targetCenterY + (isY ? yDif : -yDif * 2) + (isX ? xDif : -xDif)}
                style={{background: "rgba(71,34,34,0)", color: data.isPath ? "#FFF000" : "#000000"}}
                requiredExtensions="http://www.w3.org/1999/xhtml"
            >
                {label}
            </foreignObject>
        </>
    );
}
