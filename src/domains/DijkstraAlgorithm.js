
function isAllWalked(isWalked) {

    for (let i in isWalked) {

        if (!isWalked[i]) {
            return false;
        }
    }

    return true;
}

function calculateDijkstra(state, source) {

    const from = parseInt(source);

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
            break;
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

    let shortPaths = [];
    for (let id in state.nodes) {

        let to = parseInt(id);

        let length = pathLength[to];

        if (from === to || length === Infinity) {
            continue;
        }

        let path = [];

        path.push(from);

        let i = to;
        while ((i = p[i])) {

            if (i === from) {
                break;
            }

            path.push(i);
        }

        path.push(to);

        shortPaths.push({
            path,
            length
        })
    }

    return shortPaths;
}

export default calculateDijkstra;
