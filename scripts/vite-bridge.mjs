// For the phone, when Vite has bound ::1 alone.
//
// `adb reverse` dials 127.0.0.1, so an IPv6-only dev server leaves the phone
// with a connection refused while the PC's own localhost:5173 works fine.
// This listens on IPv4 and pipes to the IPv6 server, and phone.ps1 then points
// the reverse at 5180, so the phone keeps its localhost:5173 origin.
//
//   node scripts/vite-bridge.mjs   (leave it running, then rerun phone.ps1)
import net from 'node:net';

const LISTEN = 5180;
const TARGET = 5173;

net
  .createServer((phone) => {
    const vite = net.connect(TARGET, '::1');
    phone.pipe(vite);
    vite.pipe(phone);
    const drop = () => {
      phone.destroy();
      vite.destroy();
    };
    phone.on('error', drop);
    vite.on('error', drop);
  })
  .listen(LISTEN, '127.0.0.1', () =>
    console.log(`bridge 127.0.0.1:${LISTEN} -> [::1]:${TARGET}, leave this running`),
  );
