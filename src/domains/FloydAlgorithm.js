
function calculateFloyd(state) {

    const d = {};
    const p = {};
    let n = 0;

    for (const edge of state.edges) {

        const from = parseInt(edge.from);
        const to = parseInt(edge.to);
        const weigh = parseInt(edge.weigh);

        n = Math.max(from, to, n);

        if (!d[from]) {
            d[from] = {};
            p[from] = {};
        }

        if (!d[to]) {
            d[to] = {};
            p[to] = {};
        }

        d[from][from] = 0;
        d[to][to] = 0;

        p[from][to] = from;
        p[to][from] = to;

        d[from][to] = weigh;
    }

    for (let k = 1; k <= n; ++k) {

        for (let i = 1; i <= n; ++i) {

            if (i === k) {
                continue;
            }

            if (!d[i]) {
                d[i] = {};
            }

            if (!d[i][k]) {
                d[i][k] = Infinity;
            }

            for (let j = 1; j <= n; ++j) {

                if (j === k || i === j) {
                    continue;
                }

                if (!d[k]) {
                    d[k] = {};
                }

                if (!d[k][i]) {
                    d[k][i] = Infinity;
                }

                if (!d[i][j]) {
                    d[i][j] = Infinity;
                }

                let sum = d[i][k] + d[k][j];
                if (sum < d[i][j]) {
                    d[i][j] = sum;
                    p[i][j] = p[k][j];
                }
            }
        }
    }

    let shortPaths = [];

    for (let i in state.nodes) {

        let from = parseInt(i);

        for (let j = 1; j <= n; ++j) {

            if (j === from) {
                continue;
            }

            if (!d[from][j] || d[from][j] === Infinity) {
                continue;
            }

            let length = d[from][j];

            let path = [];

            path.unshift(j);

            let x = j;
            while ((x = p[from][x]) !== from) {
                path.unshift(x);
            }

            path.unshift(from);

            shortPaths.push({
                path,
                length
            })
        }
    }

    return shortPaths;
}

export default calculateFloyd;
