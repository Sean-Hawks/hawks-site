# Windows PowerShell 5.1. Public SMTP -> trusted Postfix PROXY listener.
param([int]$ListenPort=25,[string]$BackendAddress='100.122.23.119',[int]$BackendPort=2525)
$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

public static class HawksMailIngress {
    static readonly SemaphoreSlim Slots = new SemaphoreSlim(64, 64);
    static async Task Pump(NetworkStream source, NetworkStream destination) {
        byte[] buffer = new byte[16384];
        for (;;) {
            Task<int> read = source.ReadAsync(buffer, 0, buffer.Length);
            using (var deadline = new CancellationTokenSource()) {
                if (await Task.WhenAny(read, Task.Delay(120000, deadline.Token)) != read)
                    throw new TimeoutException("SMTP read idle timeout");
                deadline.Cancel();
            }
            int count = await read;
            if (count == 0) return;
            Task write = destination.WriteAsync(buffer, 0, count);
            using (var deadline = new CancellationTokenSource()) {
                if (await Task.WhenAny(write, Task.Delay(120000, deadline.Token)) != write)
                    throw new TimeoutException("SMTP write idle timeout");
                deadline.Cancel();
            }
            await write;
        }
    }
    static async Task Handle(TcpClient client, string address, int port) {
        string peerLabel = "unknown";
        try {
            using (client)
            using (var backend = new TcpClient(AddressFamily.InterNetwork)) {
                IPEndPoint peer = (IPEndPoint)client.Client.RemoteEndPoint;
                peerLabel = peer.Address.ToString();
                Task connect = backend.ConnectAsync(address, port);
                using (var deadline = new CancellationTokenSource()) {
                    if (await Task.WhenAny(connect, Task.Delay(10000, deadline.Token)) != connect)
                        throw new TimeoutException("Postfix connect timeout");
                    deadline.Cancel();
                }
                await connect;
                var local = (IPEndPoint)client.Client.LocalEndPoint;
                byte[] proxy = Encoding.ASCII.GetBytes(String.Format(
                    "PROXY TCP4 {0} {1} {2} {3}\r\n", peer.Address, local.Address, peer.Port, local.Port));
                NetworkStream incoming = client.GetStream(), outgoing = backend.GetStream();
                await outgoing.WriteAsync(proxy, 0, proxy.Length);
                Task up = Pump(incoming, outgoing), down = Pump(outgoing, incoming);
                Task finished = await Task.WhenAny(up, down);
                // C# 5 (Windows PowerShell 5.1) does not support await in finally.
                // Closing both sockets interrupts the other direction, including stalled I/O.
                client.Close(); backend.Close();
                try { await Task.WhenAll(up, down); } catch { }
                await finished;
            }
        } catch (Exception error) {
            Console.Error.WriteLine("{0:o} SMTP peer={1} error={2}", DateTime.UtcNow, peerLabel, error.GetType().Name);
        } finally { Slots.Release(); }
    }
    static async Task Serve(int listenPort, string address, int port) {
        var listener = new TcpListener(IPAddress.Any, listenPort);
        listener.Start(64);
        Console.WriteLine("{0:o} SMTP ingress listening on TCP {1}", DateTime.UtcNow, listenPort);
        try {
            for (;;) {
                TcpClient client = await listener.AcceptTcpClientAsync();
                if (!Slots.Wait(0)) { client.Close(); continue; }
                // Handle catches every connection error and always releases its slot.
                Task connection = Handle(client, address, port);
            }
        } finally { listener.Stop(); }
    }
    public static void Run(int listenPort, string address, int port) {
        Serve(listenPort, address, port).GetAwaiter().GetResult();
    }
}
'@
[HawksMailIngress]::Run($ListenPort,$BackendAddress,$BackendPort)
