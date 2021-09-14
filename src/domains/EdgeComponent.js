import {ArrowHeadType, StraightEdge} from "react-flow-renderer";

let isRight = false;

const EdgeComponent = (
    { id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, style, arrowHeadType, data }
) => {

    debugger

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

    isRight = !isRight;

    xDif += isRight ? 10 : -10;
    yDif += isRight ? 10 : -10;

    return (
        <StraightEdge
            id={id}
            source={source}
            target={target}
            sourceX={sourceCenterX + (isX ? -xDif : xDif)}
            sourceY={sourceCenterY + (isY ? -yDif : yDif)}
            arrowHeadType={ arrowHeadType === ArrowHeadType.Arrow ? null : ArrowHeadType.ArrowClosed}
            targetX={targetCenterX + (isX ? xDif : -xDif)}
            targetY={targetCenterY + (isY ? yDif : -yDif)}
            sourcePosition={sourcePosition}
            targetPosition={targetPosition}
            label={label}
            style={style}
        />
    );
};

export default EdgeComponent;
