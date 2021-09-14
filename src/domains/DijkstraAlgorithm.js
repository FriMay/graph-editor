
function isAllWalked(isWalked) {

    for (let i in isWalked) {

        if (!isWalked[i]) {
            return false;
        }
    }

    return true;
}

function calculate(state, source, target) {

    const edges = {};

    const p = {};
    const pathLength = {};
    const isWalked = {};
    for (const edge of state.edges) {

        const from = parseInt(edge.from);
        const to = parseInt(edge.to);
        const weigh = parseInt(edge.weigh);

        if (!edges[from]) {
            edges[from] = {};
        }

        if (!edges[to]) {
            edges[to] = {};
        }

        edges[from][to] = weigh;
        if (!edge.isOriented) {
            edges[to][from] = weigh;
        }

        p[from] = source;
        p[to] = source;

        pathLength[from] = Infinity;
        pathLength[to] = Infinity;

        isWalked[from] = false;
        isWalked[to] = false;
    }

    pathLength[source] = 0;

    while (!isAllWalked(isWalked)) {

        let min = Infinity;
        let minEdge = Infinity;

        for (let i in edges) {

            if (isWalked[i]) {
                continue;
            }

            if (pathLength[i] < min) {
                min = pathLength[i];
                minEdge = parseInt(i);
            }
        }

        if (min === Infinity) {
            return [-1, []];
        }

        for (let i in edges[minEdge]) {

            if (isWalked[i]) {
                continue;
            }

            const newVal = pathLength[minEdge] + edges[minEdge][i];

            if (newVal < pathLength[i]) {
                pathLength[i] = newVal;
                p[i] = minEdge;
            }
        }

        isWalked[minEdge] = true;
    }

    let result = [];

    let i = target;
    while (true) {

        let nextEdge = p[i];

        if (nextEdge) {

            result.push({from: i, to: nextEdge});

            if (nextEdge === source) {
                break;
            }

            i = nextEdge;
        } else {
            result = [];
            break;
        }
    }

    return [pathLength[target], result];
}




export default calculate;
