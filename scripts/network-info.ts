import { networkInterfaces } from "node:os";

/**
 * Returns all non-internal IPv4 addresses on this machine.
 * Used by dev helpers (dev-server.ts, swagger-serve.ts) to print
 * "Red local: http://X.X.X.X:PORT" without hardcoding IPs.
 *
 * Auto-detection means the helpers work on any machine/network without config.
 */
export function getLocalIPv4Addresses(): string[] {
  const interfaces = networkInterfaces();
  const ips: string[] = [];
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const iface of entries) {
      if (iface.internal) continue;
      if (iface.family !== "IPv4") continue;
      ips.push(iface.address);
    }
  }
  return ips;
}