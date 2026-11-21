/**
 * Utilidades geoespaciales para validación en el Backend (Node.js)
 * - Contención de lote dentro del perímetro de la finca
 * - Detección de solapamiento entre lotes
 */

function extractPolygonCoordinates(geoJson) {
  if (!geoJson) return null;

  try {
    let coords = null;
    if (geoJson.geometry && geoJson.geometry.type === 'Polygon') {
      coords = geoJson.geometry.coordinates?.[0];
    } else if (geoJson.type === 'Polygon') {
      coords = geoJson.coordinates?.[0];
    } else if (geoJson.type === 'Feature' && geoJson.geometry?.coordinates) {
      coords = geoJson.geometry.coordinates[0];
    } else if (Array.isArray(geoJson) && geoJson.length > 0) {
      coords = geoJson;
    }

    if (!Array.isArray(coords) || coords.length < 3) return null;

    const cleaned = coords
      .map((c) => {
        if (Array.isArray(c) && c.length >= 2) {
          return [Number(c[0]), Number(c[1])];
        }
        if (c && typeof c === 'object' && 'lng' in c && 'lat' in c) {
          return [Number(c.lng), Number(c.lat)];
        }
        return null;
      })
      .filter((c) => c !== null && !isNaN(c[0]) && !isNaN(c[1]));

    if (cleaned.length < 3) return null;

    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      cleaned.push([first[0], first[1]]);
    }

    return cleaned;
  } catch (err) {
    return null;
  }
}

function isPointInPolygon(point, polygon) {
  const [px, py] = point;
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

function doSegmentsIntersect(p1, p2, p3, p4) {
  const ccw = (a, b, c) => (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);

  const a = p1,
    b = p2,
    c = p3,
    d = p4;

  const ab_cd = ccw(a, c, d) !== ccw(b, c, d);
  const cd_ab = ccw(a, b, c) !== ccw(a, b, d);

  if (ab_cd && cd_ab) {
    const samePoint = (pt1, pt2) =>
      Math.abs(pt1[0] - pt2[0]) < 1e-7 && Math.abs(pt1[1] - pt2[1]) < 1e-7;

    if (samePoint(a, c) || samePoint(a, d) || samePoint(b, c) || samePoint(b, d)) {
      return false;
    }
    return true;
  }

  return false;
}

function findSegmentIntersection(p1, p2, p3, p4) {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const [x3, y3] = p3;
  const [x4, y4] = p4;

  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(denom) < 1e-10) return null;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return [x1 + ua * (x2 - x1), y1 + ua * (y2 - y1)];
  }

  return null;
}

function calculateCentroid(coords) {
  let cx = 0;
  let cy = 0;
  let count = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    cx += coords[i][0];
    cy += coords[i][1];
    count++;
  }

  if (count === 0) return coords[0] || [0, 0];
  return [cx / count, cy / count];
}

function distanceBetweenMeters(p1, p2) {
  const R = 6371000;
  const dLat = ((p2[1] - p1[1]) * Math.PI) / 180;
  const dLng = ((p2[0] - p1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[1] * Math.PI) / 180) *
      Math.cos((p2[1] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function closestPointOnSegment(p, a, b) {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;

  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) {
    return { point: a, distance: distanceBetweenMeters(p, a) };
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const proj = [ax + t * dx, ay + t * dy];

  return {
    point: proj,
    distance: distanceBetweenMeters(p, proj),
  };
}

/**
 * Valida que un lote esté contenido dentro del perímetro de la finca
 */
function validateLoteInsideFinca(loteGeo, fincaGeo) {
  const loteCoords = extractPolygonCoordinates(loteGeo);
  const fincaCoords = extractPolygonCoordinates(fincaGeo);

  if (!loteCoords || !fincaCoords) {
    return { isValid: true };
  }

  // Verificar vértices con tolerancia de borde de 1.5 metros
  for (let i = 0; i < loteCoords.length - 1; i++) {
    const pt = loteCoords[i];
    const inside = isPointInPolygon(pt, fincaCoords);
    if (!inside) {
      let onBoundary = false;
      for (let j = 0; j < fincaCoords.length - 1; j++) {
        const { distance } = closestPointOnSegment(pt, fincaCoords[j], fincaCoords[j + 1]);
        if (distance <= 1.5) {
          onBoundary = true;
          break;
        }
      }
      if (!onBoundary) {
        return {
          isValid: false,
          message: 'El lote excede los límites geográficos de la finca. Debe estar dentro de su perímetro.',
        };
      }
    }
  }

  // Verificar cruces de aristas
  for (let i = 0; i < loteCoords.length - 1; i++) {
    const l1 = loteCoords[i];
    const l2 = loteCoords[i + 1];
    for (let j = 0; j < fincaCoords.length - 1; j++) {
      const f1 = fincaCoords[j];
      const f2 = fincaCoords[j + 1];
      if (doSegmentsIntersect(l1, l2, f1, f2)) {
        return {
          isValid: false,
          message: 'Uno de los bordes del lote cruza y sale del perímetro de la finca.',
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Valida que un nuevo lote no se solape con lotes existentes
 */
function validateNoOverlap(newLoteGeo, lotesExistentes, currentLoteId = null) {
  const newCoords = extractPolygonCoordinates(newLoteGeo);
  if (!newCoords || !Array.isArray(lotesExistentes) || lotesExistentes.length === 0) {
    return { isValid: true };
  }

  for (const lote of lotesExistentes) {
    if (currentLoteId && String(lote.id) === String(currentLoteId)) {
      continue;
    }

    const existCoords = extractPolygonCoordinates(lote.geometria);
    if (!existCoords) continue;

    // 1. Cruce de aristas
    for (let i = 0; i < newCoords.length - 1; i++) {
      for (let j = 0; j < existCoords.length - 1; j++) {
        if (doSegmentsIntersect(newCoords[i], newCoords[i + 1], existCoords[j], existCoords[j + 1])) {
          return {
            isValid: false,
            message: `El lote invade el área del lote existente '${lote.nombre}' (${lote.tipo}). No se permite solapamiento.`,
          };
        }
      }
    }

    // 2. Vértices dentro
    for (let i = 0; i < newCoords.length - 1; i++) {
      const pt = newCoords[i];
      if (isPointInPolygon(pt, existCoords)) {
        let onBoundary = false;
        for (let j = 0; j < existCoords.length - 1; j++) {
          const { distance } = closestPointOnSegment(pt, existCoords[j], existCoords[j + 1]);
          if (distance <= 0.8) {
            onBoundary = true;
            break;
          }
        }
        if (!onBoundary) {
          return {
            isValid: false,
            message: `El lote se superpone con el lote existente '${lote.nombre}' (${lote.tipo}).`,
          };
        }
      }
    }

    // 3. Vértices existentes dentro del nuevo
    for (let i = 0; i < existCoords.length - 1; i++) {
      const pt = existCoords[i];
      if (isPointInPolygon(pt, newCoords)) {
        let onBoundary = false;
        for (let j = 0; j < newCoords.length - 1; j++) {
          const { distance } = closestPointOnSegment(pt, newCoords[j], newCoords[j + 1]);
          if (distance <= 0.8) {
            onBoundary = true;
            break;
          }
        }
        if (!onBoundary) {
          return {
            isValid: false,
            message: `El lote encierra o se solapa con el lote existente '${lote.nombre}' (${lote.tipo}).`,
          };
        }
      }
    }
  }

  return { isValid: true };
}

function clampAndAdaptPolygonToFincaAndLotes(loteCoords, fincaCoords, lotesExistentes, currentLoteId = null) {
  if (!loteCoords || loteCoords.length < 3) {
    return loteCoords;
  }

  let currentCoords = [...loteCoords];

  // 1. Clamping de vértices fuera del perímetro de la finca
  if (fincaCoords && fincaCoords.length >= 3) {
    currentCoords = currentCoords.map((pt, idx) => {
      if (idx === currentCoords.length - 1 && currentCoords.length > 2) return pt;
      if (!isPointInPolygon(pt, fincaCoords)) {
        let minDist = Infinity;
        let clampedPt = pt;
        for (let j = 0; j < fincaCoords.length - 1; j++) {
          const { point, distance } = closestPointOnSegment(pt, fincaCoords[j], fincaCoords[j + 1]);
          if (distance < minDist) {
            minDist = distance;
            clampedPt = point;
          }
        }
        return clampedPt;
      }
      return pt;
    });

    const withInter = [];
    for (let i = 0; i < currentCoords.length - 1; i++) {
      const p1 = currentCoords[i];
      const p2 = currentCoords[i + 1];
      withInter.push(p1);
      for (let j = 0; j < fincaCoords.length - 1; j++) {
        const inter = findSegmentIntersection(p1, p2, fincaCoords[j], fincaCoords[j + 1]);
        if (inter) withInter.push(inter);
      }
    }
    withInter.push(currentCoords[currentCoords.length - 1]);
    currentCoords = withInter;
  }

  // 2. Proyección de vértices que caen dentro de lotes vecinos
  if (Array.isArray(lotesExistentes)) {
    for (const lote of lotesExistentes) {
      if (currentLoteId && String(lote.id) === String(currentLoteId)) continue;
      const existCoords = extractPolygonCoordinates(lote.geometria);
      if (!existCoords || existCoords.length < 3) continue;

      currentCoords = currentCoords.map((pt, idx) => {
        if (idx === currentCoords.length - 1 && currentCoords.length > 2) return pt;
        if (isPointInPolygon(pt, existCoords)) {
          let minDist = Infinity;
          let projectedPt = pt;
          for (let j = 0; j < existCoords.length - 1; j++) {
            const { point, distance } = closestPointOnSegment(pt, existCoords[j], existCoords[j + 1]);
            if (distance < minDist) {
              minDist = distance;
              projectedPt = point;
            }
          }
          return projectedPt;
        }
        return pt;
      });
    }
  }

  // 3. Limpieza y cierre
  const cleaned = [];
  for (let i = 0; i < currentCoords.length; i++) {
    const pt = currentCoords[i];
    if (cleaned.length === 0) {
      cleaned.push(pt);
    } else {
      const prev = cleaned[cleaned.length - 1];
      if (distanceBetweenMeters(pt, prev) > 0.1) {
        cleaned.push(pt);
      }
    }
  }

  if (cleaned.length < 3) return loteCoords;

  const first = cleaned[0];
  const last = cleaned[cleaned.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    cleaned.push([first[0], first[1]]);
  }

  return cleaned;
}

module.exports = {
  extractPolygonCoordinates,
  isPointInPolygon,
  doSegmentsIntersect,
  findSegmentIntersection,
  calculateCentroid,
  distanceBetweenMeters,
  closestPointOnSegment,
  validateLoteInsideFinca,
  validateNoOverlap,
  clampAndAdaptPolygonToFincaAndLotes,
};
