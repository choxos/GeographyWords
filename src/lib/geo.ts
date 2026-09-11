export type LngLat = { lng: number; lat: number };

const EARTH_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function haversineKm(a: LngLat, b: LngLat): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString("en-US")} km`;
}

function slerp(u: number[], v: number[], t: number): number[] {
  const dot = Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-6) return u;
  const sinO = Math.sin(omega);
  const s0 = Math.sin((1 - t) * omega) / sinO;
  const s1 = Math.sin(t * omega) / sinO;
  return [s0 * u[0] + s1 * v[0], s0 * u[1] + s1 * v[1], s0 * u[2] + s1 * v[2]];
}

function toCart(lng: number, lat: number): number[] {
  const rLat = toRad(lat);
  const rLng = toRad(lng);
  return [
    Math.cos(rLat) * Math.cos(rLng),
    Math.cos(rLat) * Math.sin(rLng),
    Math.sin(rLat),
  ];
}

function fromCart(c: number[]): [number, number] {
  const hyp = Math.hypot(c[0], c[1]);
  return [toDeg(Math.atan2(c[1], c[0])), toDeg(Math.atan2(c[2], hyp))];
}

export function greatCircle(
  start: LngLat,
  end: LngLat,
  steps = 72,
): GeoJSON.LineString {
  const u = toCart(start.lng, start.lat);
  const v = toCart(end.lng, end.lat);
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i += 1) {
    coords.push(fromCart(slerp(u, v, i / steps)));
  }
  return { type: "LineString", coordinates: coords };
}

export function centroid(points: LngLat[]): LngLat {
  if (points.length === 0) return { lng: 12, lat: 20 };
  const x = points.reduce((s, p) => s + p.lng, 0) / points.length;
  const y = points.reduce((s, p) => s + p.lat, 0) / points.length;
  return { lng: x, lat: y };
}
