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
type StatusCallback = (connected: boolean) => void;

class WSClient {
  private ws: WebSocket | null = null;
  private callbacks: Callback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private url: string = "";
  private reconnectDelay = 3000; // 3 detik
  private shouldReconnect = true;

  private setStatus(connected: boolean) {
    this.statusCallbacks.forEach((cb) => cb(connected));
  }

  connect(url: string) {
    this.url = url;
    this.shouldReconnect = true;

    const sock = new WebSocket(url);
    this.ws = sock;

    sock.onopen = () => {
      console.log("WS Connected");
      this.setStatus(true);
    };

    sock.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.callbacks.forEach((cb) => cb(data));
      } catch (err) {
        console.error("JSON error", err);
      }
    };

    sock.onclose = () => {
      // socket lama (sudah diganti connect baru) tidak boleh memicu apa-apa
      if (this.ws !== sock) return;
      console.log("WS Disconnected");
      this.setStatus(false);

      if (this.shouldReconnect) {
        console.log("Reconnecting in 3s...");
        setTimeout(() => {
          if (this.shouldReconnect) this.connect(this.url);
        }, this.reconnectDelay);
      }
    };

    sock.onerror = (err) => {
      console.error("WS Error", err);
      sock.close(); // trigger onclose -> reconnect
    };
  }

  // return fungsi unsubscribe supaya callback tidak menumpuk
  subscribe(cb: Callback) {
    this.callbacks.push(cb);
    return () => {
      this.callbacks = this.callbacks.filter((c) => c !== cb);
    };
  }

  onStatus(cb: StatusCallback) {
    this.statusCallbacks.push(cb);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter((c) => c !== cb);
    };
  }

  disconnect() {
    this.shouldReconnect = false; // stop reconnect
    this.ws?.close();
  }
}

export const wsClient = new WSClient();
