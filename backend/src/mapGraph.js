const graph = {
    nodes: {
        'A': { id: 'A', x: 0, y: 300 },
        'B': { id: 'B', x: 400, y: 300 },
        'C': { id: 'C', x: 700, y: 300 },
        'D': { id: 'D', x: 1000, y: 300 },
        'E': { id: 'E', x: 400, y: 0 },
        'F': { id: 'F', x: 400, y: 600 },
        'G': { id: 'G', x: 400, y: 800 },
        'H': { id: 'H', x: 700, y: 0 },
        'I': { id: 'I', x: 700, y: 600 },
        'J': { id: 'J', x: 700, y: 800 },
        'K': { id: 'K', x: 0, y: 600 },
        'L': { id: 'L', x: 1000, y: 600 },
    },
    edges: [
        { from: 'A', to: 'B', direction: 'E' },
        { from: 'B', to: 'A', direction: 'W' },
        { from: 'B', to: 'C', direction: 'E' },
        { from: 'C', to: 'B', direction: 'W' },
        { from: 'C', to: 'D', direction: 'E' },
        { from: 'D', to: 'C', direction: 'W' },

        { from: 'E', to: 'B', direction: 'S' },
        { from: 'B', to: 'E', direction: 'N' },
        { from: 'B', to: 'F', direction: 'S' },
        { from: 'F', to: 'B', direction: 'N' },
        { from: 'F', to: 'G', direction: 'S' },
        { from: 'G', to: 'F', direction: 'N' },

        { from: 'H', to: 'C', direction: 'S' },
        { from: 'C', to: 'H', direction: 'N' },
        { from: 'C', to: 'I', direction: 'S' },
        { from: 'I', to: 'C', direction: 'N' },
        { from: 'I', to: 'J', direction: 'S' },
        { from: 'J', to: 'I', direction: 'N' },

        { from: 'K', to: 'F', direction: 'E' },
        { from: 'F', to: 'K', direction: 'W' },
        { from: 'F', to: 'I', direction: 'E' },
        { from: 'I', to: 'F', direction: 'W' },
        { from: 'I', to: 'L', direction: 'E' },
        { from: 'L', to: 'I', direction: 'W' },
    ]
};

function getDistanceNodes(n1, n2) {
    return Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
}

function findPath(startId, goalId) {
    let openSet = [startId];
    let cameFrom = {};
    let gScore = {};
    let fScore = {};

    Object.keys(graph.nodes).forEach(n => {
        gScore[n] = Infinity;
        fScore[n] = Infinity;
    });
    gScore[startId] = 0;
    fScore[startId] = getDistanceNodes(graph.nodes[startId], graph.nodes[goalId]);

    while (openSet.length > 0) {
        let current = openSet.reduce((a, b) => fScore[a] < fScore[b] ? a : b);
        if (current === goalId) {
            return reconstructPath(cameFrom, current);
        }
        openSet = openSet.filter(n => n !== current);

        const neighbors = graph.edges.filter(e => e.from === current).map(e => e.to);
        for (let neighbor of neighbors) {
            let tentative_gScore = gScore[current] + getDistanceNodes(graph.nodes[current], graph.nodes[neighbor]);

            if (tentative_gScore < gScore[neighbor]) {
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentative_gScore;
                fScore[neighbor] = gScore[neighbor] + getDistanceNodes(graph.nodes[neighbor], graph.nodes[goalId]);
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    return [];
}

function reconstructPath(cameFrom, current) {
    let totalPath = [current];
    while (cameFrom[current]) {
        current = cameFrom[current];
        totalPath.unshift(current);
    }
    return totalPath;
}

function getRandomNode() {
    const keys = Object.keys(graph.nodes);
    return keys[Math.floor(Math.random() * keys.length)];
}

module.exports = {
    graph,
    findPath,
    getDistanceNodes,
    getRandomNode
};
