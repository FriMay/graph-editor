import {StraightEdge} from "react-flow-renderer";

const EdgeComponent = (
    { id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, style }
) => {

    return (
        <StraightEdge
            id={id}
            source={source}
            target={target}
            sourceX={sourceX}
            sourceY={sourceY + 25}
            targetX={targetX}
            targetY={targetY - 25}
            sourcePosition={sourcePosition}
            targetPosition={targetPosition}
            label={label}
            style={style}
        />
    );
};

export default EdgeComponent;
