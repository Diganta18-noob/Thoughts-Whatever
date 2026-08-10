import dns from "dns";
import net from "net";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const srvHostname = "_mongodb._tcp.cluster0.jyqzbmc.mongodb.net";

console.log(`🔍 Resolving DNS SRV record via 8.8.8.8 for ${srvHostname}...`);
dns.resolveSrv(srvHostname, (err, addresses) => {
  if (err) {
    console.error("❌ DNS SRV resolution error:", err.message);
    return;
  }
  console.log("✅ SRV resolution successful! Resolved MongoDB hosts:", addresses);

  if (addresses.length > 0) {
    const target = addresses[0];
    console.log(`🔍 Testing TCP socket to ${target.name}:${target.port}...`);
    const socket = net.createConnection({ host: target.name, port: target.port, timeout: 5000 }, () => {
      console.log(`✅ Successfully connected to MongoDB Atlas node ${target.name}!`);
      socket.end();
    });
    socket.on("error", (e) => console.error("❌ Socket error:", e.message));
  }
});
