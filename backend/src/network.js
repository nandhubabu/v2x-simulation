class NetworkSimulator {
    constructor() {
        this.latencyMs = 0; // Configurable latency
        this.packetLoss = 0; // Configurable packet loss (0 to 1)
    }

    broadcast(wss, state) {
        const message = JSON.stringify(state);

        wss.clients.forEach(client => {
            if (client.readyState === 1 /* WebSocket.OPEN */) {
                // Packet Loss
                if (Math.random() < this.packetLoss) {
                    return; // Drop packet
                }

                // Latency
                if (this.latencyMs > 0) {
                    setTimeout(() => {
                        if (client.readyState === 1) client.send(message);
                    }, this.latencyMs);
                } else {
                    client.send(message);
                }
            }
        });
    }

    setParams(latencyMs, packetLoss) {
        this.latencyMs = latencyMs;
        this.packetLoss = packetLoss;
    }
}
module.exports = new NetworkSimulator();
