import {Handle} from "react-flow-renderer";

const NodeComponent = ({id}) => {

    return (
        <>
            <div style={{
                margin: "auto",
                position: "relative",
                textAlign: "center",
                top: "20%",
                width: "50%",
            }}>
                {id}
            </div>
            <Handle type="target" position="bottom" style={{borderRadius: 0, visibility: "hidden"}}/>
            <Handle type="input" position="top" style={{borderRadius: 0, visibility: "hidden"}}/>
        </>
    );
};

export default NodeComponent;
