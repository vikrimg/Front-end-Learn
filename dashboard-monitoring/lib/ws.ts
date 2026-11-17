// type Callback = (data: any) => void;

// class WSClient {
//   private ws: WebSocket | null = null;
//   private callbacks: Callback[] = [];

//   connect(url: string) {
//     this.ws = new WebSocket(url);

//     this.ws.onopen = () => {
//       console.log("WS Connected");
//     };

//     this.ws.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);

//         // broadcast ke semua subscriber
//         this.callbacks.forEach((cb) => cb(data));
//       } catch (err) {
//         console.error("JSON error", err);
//       }
//     };

//     this.ws.onclose = () => {
//       console.log("WS Disconnected");
//     };

//     this.ws.onerror = (err) => {
//       console.error("WS Error", err);
//     };
//   }

//   subscribe(cb: Callback) {
//     this.callbacks.push(cb);
//   }

//   disconnect() {
//     this.ws?.close();
//   }
// }

// export const wsClient = new WSClient();

type Callback = (data: any) => void;

class WSClient {
  private ws: WebSocket | null = null;
  private callbacks: Callback[] = [];
  private url: string = "";
  private reconnectDelay = 3000; // 3 detik
  private shouldReconnect = true;

  connect(url: string) {
    this.url = url;
    this.shouldReconnect = true;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("WS Connected");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.callbacks.forEach((cb) => cb(data));
      } catch (err) {
        console.error("JSON error", err);
      }
    };

    this.ws.onclose = () => {
      console.log("WS Disconnected");

      if (this.shouldReconnect) {
        console.log("Reconnecting in 3s...");
        setTimeout(() => {
          this.connect(this.url);
        }, this.reconnectDelay);
      }
    };

    this.ws.onerror = (err) => {
      console.error("WS Error", err);
      this.ws?.close(); // trigger onclose → reconnect
    };
  }

  subscribe(cb: Callback) {
    this.callbacks.push(cb);
  }

  disconnect() {
    this.shouldReconnect = false; // stop reconnect
    this.ws?.close();
  }
}

export const wsClient = new WSClient();