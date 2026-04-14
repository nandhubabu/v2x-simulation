class TrafficLight {
    constructor(id, x, y, initialState = 'red') {
        this.id = id;
        this.x = x;
        this.y = y;
        this.state = initialState; // 'red', 'green', 'yellow'
        this.timer = 0;
    }

    update(tickRateMs, hasEmergencyVehiclePriority = false) {
        if (hasEmergencyVehiclePriority) {
            this.state = 'green';
            this.timer = 0;
            return;
        }

        this.timer += tickRateMs;
        // Basic cycle: Green 5s -> Yellow 2s -> Red 5s
        if (this.state === 'green' && this.timer >= 5000) {
            this.state = 'yellow';
            this.timer = 0;
        } else if (this.state === 'yellow' && this.timer >= 2000) {
            this.state = 'red';
            this.timer = 0;
        } else if (this.state === 'red' && this.timer >= 5000) {
            this.state = 'green';
            this.timer = 0;
        }
    }
}

module.exports = TrafficLight;
