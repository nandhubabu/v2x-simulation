const { graph, findPath } = require('./mapGraph');

class Vehicle {
    constructor(startNodeId, goalNodeId, speed, type = 'normal') {
        this.id = 'v-' + Math.random().toString(36).substr(2, 9);

        // Graph routing
        this.currentNodeId = startNodeId;
        this.goalNodeId = goalNodeId;
        this.path = findPath(startNodeId, goalNodeId);
        this.pathIndex = 0;

        const startNode = graph.nodes[startNodeId];
        this.x = startNode.x;
        this.y = startNode.y;

        this.speed = speed;
        this.baseSpeed = speed;
        this.type = type; // 'normal', 'emergency'
        this.status = 'moving'; // 'moving', 'stopped', 'slowing_hazard', 'collision_warning', 'done'

        this.setDirectionToNextNode();
    }

    setDirectionToNextNode() {
        if (this.pathIndex >= this.path.length - 1) {
            this.direction = null; // Reached goal
            return;
        }
        const currentNode = graph.nodes[this.path[this.pathIndex]];
        const nextNode = graph.nodes[this.path[this.pathIndex + 1]];

        if (nextNode.x > currentNode.x) this.direction = 'E';
        else if (nextNode.x < currentNode.x) this.direction = 'W';
        else if (nextNode.y > currentNode.y) this.direction = 'S';
        else if (nextNode.y < currentNode.y) this.direction = 'N';
    }

    updatePosition(tickRateMs) {
        if (this.status === 'stopped' || this.status === 'done' || !this.direction) return;

        const distanceToMove = (this.speed * tickRateMs) / 1000;

        const nextNodeId = this.path[this.pathIndex + 1];
        if (!nextNodeId) {
            this.status = 'done';
            return;
        }
        const nextNode = graph.nodes[nextNodeId];

        // Move towards next node
        let reachedNode = false;
        if (this.direction === 'N') {
            this.y -= distanceToMove;
            if (this.y <= nextNode.y) { this.y = nextNode.y; reachedNode = true; }
        } else if (this.direction === 'S') {
            this.y += distanceToMove;
            if (this.y >= nextNode.y) { this.y = nextNode.y; reachedNode = true; }
        } else if (this.direction === 'E') {
            this.x += distanceToMove;
            if (this.x >= nextNode.x) { this.x = nextNode.x; reachedNode = true; }
        } else if (this.direction === 'W') {
            this.x -= distanceToMove;
            if (this.x <= nextNode.x) { this.x = nextNode.x; reachedNode = true; }
        }

        if (reachedNode) {
            this.pathIndex++;
            if (this.pathIndex >= this.path.length - 1) {
                this.status = 'done';
            } else {
                this.setDirectionToNextNode();
            }
        }
    }
}

module.exports = Vehicle;
