/**
 * Utilidades geoespaciales y cartográficas para el Sistema de Finca LODANA
 * - Validaciones espaciales: contención dentro de finca, solapamiento entre lotes
 * - Snapping automático a bordes y vértices cercanos
 * - Cálculo de centroides, áreas aproximadas y bounding boxes
 * - Importación y exportación de archivos KML y KMZ (Google Earth)
 */

export type Coordinate = [number, number]; // [lng, lat] en formato GeoJSON

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Normaliza cualquier estructura GeoJSON a un array de coordenadas de polígono [lng, lat]
 */
export function extractPolygonCoordinates(geoJson: any): Coordinate[] | null {
  if (!geoJson) return null;

  try {
    let coords: any = null;

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

    // Asegurar formato [lng, lat] con números válidos
    const cleaned: Coordinate[] = coords
      .map((c: any) => {
        if (Array.isArray(c) && c.length >= 2) {
          return [Number(c[0]), Number(c[1])] as Coordinate;
        }
        if (c && typeof c === 'object' && 'lng' in c && 'lat' in c) {
          return [Number(c.lng), Number(c.lat)] as Coordinate;
        }
        return null;
      })
      .filter((c: any): c is Coordinate => c !== null && !isNaN(c[0]) && !isNaN(c[1]));

    if (cleaned.length < 3) return null;

    // Asegurar anillo cerrado si no lo está
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      cleaned.push([first[0], first[1]]);
    }

    return cleaned;
  } catch (err) {
    console.error('Error al extraer coordenadas del polígono:', err);
    return null;
  }
}

/**
 * Convierte coordenadas GeoJSON [lng, lat] a coordenadas de Leaflet [lat, lng]
 */
export function toLeafletLatLngs(coords: Coordinate[]): [number, number][] {
  return coords.map(([lng, lat]) => [lat, lng]);
}

/**
 * Convierte coordenadas de Leaflet [lat, lng] a coordenadas GeoJSON [lng, lat]
 */
export function toGeoJsonCoords(latLngs: [number, number][]): Coordinate[] {
  return latLngs.map(([lat, lng]) => [lng, lat]);
}

/**
 * Algoritmo de Ray-Casting para determinar si un punto está dentro de un polígono
 */
export function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
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

/**
 * Determina si dos segmentos de línea se cruzan estrictamente (intersección interior)
 */
export function doSegmentsIntersect(
  p1: Coordinate,
  p2: Coordinate,
  p3: Coordinate,
  p4: Coordinate
): boolean {
  const ccw = (a: Coordinate, b: Coordinate, c: Coordinate) => {
    return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
  };

  const a = p1,
    b = p2,
    c = p3,
    d = p4;

  const ab_cd = ccw(a, c, d) !== ccw(b, c, d);
  const cd_ab = ccw(a, b, c) !== ccw(a, b, d);

  if (ab_cd && cd_ab) {
    // Verificar si la intersección no es simplemente un vértice compartido
    const samePoint = (pt1: Coordinate, pt2: Coordinate) =>
      Math.abs(pt1[0] - pt2[0]) < 1e-7 && Math.abs(pt1[1] - pt2[1]) < 1e-7;

    if (samePoint(a, c) || samePoint(a, d) || samePoint(b, c) || samePoint(b, d)) {
      return false; // Se tocan en un vértice, no es un cruce invasivo
    }

    return true;
  }

  return false;
}

/**
 * Encuentra el punto exacto de intersección entre dos segmentos de línea si existe
 */
export function findSegmentIntersection(
  p1: Coordinate,
  p2: Coordinate,
  p3: Coordinate,
  p4: Coordinate
): Coordinate | null {
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

/**
 * Calcula el centroide de un polígono
 */
export function calculateCentroid(coords: Coordinate[]): Coordinate {
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

/**
 * Calcula el Bounding Box de un polígono
 */
export function calculateBoundingBox(coords: Coordinate[]): BoundingBox {
  let minLng = Infinity,
    maxLng = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;

  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Distancia en metros entre dos coordenadas (fórmula de Haversine)
 */
export function distanceBetweenMeters(p1: Coordinate, p2: Coordinate): number {
  const R = 6371000; // Radio de la Tierra en metros
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

/**
 * Distancia mínima y punto proyectado desde un punto hacia un segmento de línea
 */
export function closestPointOnSegment(
  p: Coordinate,
  a: Coordinate,
  b: Coordinate
): { point: Coordinate; distance: number } {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;

  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) {
    return { point: a, distance: distanceBetweenMeters(p, a) };
  }

  // Factor de proyección t clampeado entre 0 y 1
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const proj: Coordinate = [ax + t * dx, ay + t * dy];

  return {
    point: proj,
    distance: distanceBetweenMeters(p, proj),
  };
}

/**
 * Requisito 1: Valida que un lote esté 100% dentro del perímetro de la finca
 * Retorna { isValid: boolean, error?: string }
 */
export function validateLoteInsideFinca(
  loteCoords: Coordinate[],
  fincaCoords: Coordinate[]
): { isValid: boolean; error?: string } {
  if (!fincaCoords || fincaCoords.length < 3) {
    return {
      isValid: false,
      error: 'No se ha definido el perímetro de la finca. Traza y guarda primero la finca.',
    };
  }

  // 1. Validar que cada vértice del lote esté dentro del perímetro (con tolerancia de 1m)
  for (let i = 0; i < loteCoords.length - 1; i++) {
    const pt = loteCoords[i];
    const isInside = isPointInPolygon(pt, fincaCoords);

    if (!isInside) {
      // Verificar si está en el borde con tolerancia
      let closeToBoundary = false;
      for (let j = 0; j < fincaCoords.length - 1; j++) {
        const { distance } = closestPointOnSegment(pt, fincaCoords[j], fincaCoords[j + 1]);
        if (distance <= 1.5) {
          closeToBoundary = true;
          break;
        }
      }

      if (!closeToBoundary) {
        return {
          isValid: false,
          error: `El vértice ${i + 1} del lote queda fuera del perímetro de la finca.`,
        };
      }
    }
  }

  // 2. Validar que ningún borde del lote cruce hacia afuera del borde de la finca
  for (let i = 0; i < loteCoords.length - 1; i++) {
    const l1 = loteCoords[i];
    const l2 = loteCoords[i + 1];

    for (let j = 0; j < fincaCoords.length - 1; j++) {
      const f1 = fincaCoords[j];
      const f2 = fincaCoords[j + 1];

      if (doSegmentsIntersect(l1, l2, f1, f2)) {
        return {
          isValid: false,
          error: `Un límite del lote cruza y sale del perímetro de la finca.`,
        };
      }
    }
  }

  // 3. Validar que el centroide esté dentro de la finca
  const centroid = calculateCentroid(loteCoords);
  if (!isPointInPolygon(centroid, fincaCoords)) {
    return {
      isValid: false,
      error: 'El área del lote se encuentra fuera del perímetro de la finca.',
    };
  }

  return { isValid: true };
}

/**
 * Requisito 2: Valida que un nuevo lote no se solape con lotes existentes
 */
export function validateNoOverlapWithExistingLotes(
  newLoteCoords: Coordinate[],
  lotesExistentes: Array<{ id: string | number; nombre: string; tipo: string; geometria: any }>,
  loteIdActual?: string | number
): { isValid: boolean; conflictName?: string; conflictType?: string } {
  for (const lote of lotesExistentes) {
    if (loteIdActual && String(lote.id) === String(loteIdActual)) {
      continue;
    }

    const existCoords = extractPolygonCoordinates(lote.geometria);
    if (!existCoords) continue;

    // 1. Comprobar cruce de aristas
    let edgeIntersection = false;
    for (let i = 0; i < newLoteCoords.length - 1; i++) {
      for (let j = 0; j < existCoords.length - 1; j++) {
        if (
          doSegmentsIntersect(
            newLoteCoords[i],
            newLoteCoords[i + 1],
            existCoords[j],
            existCoords[j + 1]
          )
        ) {
          edgeIntersection = true;
          break;
        }
      }
      if (edgeIntersection) break;
    }

    if (edgeIntersection) {
      return {
        isValid: false,
        conflictName: lote.nombre,
        conflictType: lote.tipo,
      };
    }

    // 2. Comprobar si algún vértice del nuevo lote está estrictamente dentro del existente
    for (let i = 0; i < newLoteCoords.length - 1; i++) {
      const pt = newLoteCoords[i];
      if (isPointInPolygon(pt, existCoords)) {
        // Verificar que no sea solo un vértice en común tocándose en el borde
        let onEdge = false;
        for (let j = 0; j < existCoords.length - 1; j++) {
          const { distance } = closestPointOnSegment(pt, existCoords[j], existCoords[j + 1]);
          if (distance <= 0.8) {
            onEdge = true;
            break;
          }
        }
        if (!onEdge) {
          return {
            isValid: false,
            conflictName: lote.nombre,
            conflictType: lote.tipo,
          };
        }
      }
    }

    // 3. Comprobar si algún vértice del lote existente está estrictamente dentro del nuevo lote
    for (let i = 0; i < existCoords.length - 1; i++) {
      const pt = existCoords[i];
      if (isPointInPolygon(pt, newLoteCoords)) {
        let onEdge = false;
        for (let j = 0; j < newLoteCoords.length - 1; j++) {
          const { distance } = closestPointOnSegment(pt, newLoteCoords[j], newLoteCoords[j + 1]);
          if (distance <= 0.8) {
            onEdge = true;
            break;
          }
        }
        if (!onEdge) {
          return {
            isValid: false,
            conflictName: lote.nombre,
            conflictType: lote.tipo,
          };
        }
      }
    }

    // 4. Comprobar centroides para detección de contención mutua
    const c1 = calculateCentroid(newLoteCoords);
    const c2 = calculateCentroid(existCoords);
    if (isPointInPolygon(c1, existCoords) || isPointInPolygon(c2, newLoteCoords)) {
      return {
        isValid: false,
        conflictName: lote.nombre,
        conflictType: lote.tipo,
      };
    }
  }

  return { isValid: true };
}

/**
 * Requisito 4: Snapping automático
 * Ajusta un punto a vértices o bordes cercanos de una lista de polígonos
 * Umbral por defecto: 15 metros
 */
export function snapCoordinate(
  point: Coordinate,
  polygons: Coordinate[][],
  thresholdMeters = 15
): { snappedPoint: Coordinate; wasSnapped: boolean; snapType?: 'vertex' | 'edge' } {
  let closestVertex: Coordinate | null = null;
  let minVertexDist = Infinity;

  let closestEdgePoint: Coordinate | null = null;
  let minEdgeDist = Infinity;

  // Prioridad 1: Vértices de polígonos
  for (const poly of polygons) {
    for (let i = 0; i < poly.length - 1; i++) {
      const v = poly[i];
      const dist = distanceBetweenMeters(point, v);
      if (dist < minVertexDist && dist <= thresholdMeters) {
        minVertexDist = dist;
        closestVertex = v;
      }
    }
  }

  if (closestVertex) {
    return {
      snappedPoint: closestVertex,
      wasSnapped: true,
      snapType: 'vertex',
    };
  }

  // Prioridad 2: Proyección perpendicular en aristas/bordes
  for (const poly of polygons) {
    for (let i = 0; i < poly.length - 1; i++) {
      const a = poly[i];
      const b = poly[i + 1];
      const { point: proj, distance } = closestPointOnSegment(point, a, b);
      if (distance < minEdgeDist && distance <= thresholdMeters) {
        minEdgeDist = distance;
        closestEdgePoint = proj;
      }
    }
  }

  if (closestEdgePoint) {
    return {
      snappedPoint: closestEdgePoint,
      wasSnapped: true,
      snapType: 'edge',
    };
  }

  return {
    snappedPoint: point,
    wasSnapped: false,
  };
}

/**
 * Aplica snapping a un conjunto entero de coordenadas de polígono
 */
export function snapPolygon(
  coords: Coordinate[],
  targetPolygons: Coordinate[][],
  thresholdMeters = 15
): Coordinate[] {
  const result: Coordinate[] = coords.map((pt, index) => {
    // Si es el último vértice y coincide con el primero (anillo cerrado), lo cerraremos explícitamente al final
    if (index === coords.length - 1 && coords.length > 2) {
      return pt;
    }
    const { snappedPoint } = snapCoordinate(pt, targetPolygons, thresholdMeters);
    return snappedPoint;
  });

  if (result.length > 2) {
    result[result.length - 1] = [result[0][0], result[0][1]];
  }

  return result;
}

/**
 * Requisito: Auto-corrección y adaptación de lotes al perímetro de la finca y bordes vecinos
 * Si el lote dibujado rebasa el perímetro de la finca o toca/invade otro lote,
 * no se bloquea: se corrige automáticamente proyectando y recortando sus puntos para que
 * se adapte al tamaño dentro del mapa y quede perfectamente pegado al borde.
 */
export function clampAndAdaptPolygonToFincaAndLotes(
  loteCoords: Coordinate[],
  fincaCoords: Coordinate[] | null,
  lotesExistentes: Array<{ id: string | number; nombre: string; tipo: string; geometria: any }>,
  loteIdActual?: string | number
): { adaptedCoords: Coordinate[]; wasAdapted: boolean; detail?: string } {
  if (!loteCoords || loteCoords.length < 3) {
    return { adaptedCoords: loteCoords, wasAdapted: false };
  }

  let wasAdapted = false;
  const targetPolygons: Coordinate[][] = [];
  if (fincaCoords && fincaCoords.length >= 3) {
    targetPolygons.push(fincaCoords);
  }

  const existingLotsCoords: Coordinate[][] = [];
  for (const lote of lotesExistentes) {
    if (loteIdActual && String(lote.id) === String(loteIdActual)) continue;
    const coords = extractPolygonCoordinates(lote.geometria);
    if (coords && coords.length >= 3) {
      existingLotsCoords.push(coords);
      targetPolygons.push(coords);
    }
  }

  // 1. Snapping automático siempre activo a 15 metros
  let currentCoords = snapPolygon(loteCoords, targetPolygons, 15);

  // 2. Si el lote rebasa los límites de la finca, adaptar vértices al perímetro de la finca
  if (fincaCoords && fincaCoords.length >= 3) {
    currentCoords = currentCoords.map((pt, idx) => {
      if (idx === currentCoords.length - 1 && currentCoords.length > 2) return pt;

      const inside = isPointInPolygon(pt, fincaCoords);
      if (!inside) {
        wasAdapted = true;
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

    // Detectar intersecciones de segmentos con el perímetro e insertar vértices en el borde
    const withIntersections: Coordinate[] = [];
    for (let i = 0; i < currentCoords.length - 1; i++) {
      const p1 = currentCoords[i];
      const p2 = currentCoords[i + 1];
      withIntersections.push(p1);

      for (let j = 0; j < fincaCoords.length - 1; j++) {
        const f1 = fincaCoords[j];
        const f2 = fincaCoords[j + 1];
        const inter = findSegmentIntersection(p1, p2, f1, f2);
        if (inter) {
          wasAdapted = true;
          withIntersections.push(inter);
        }
      }
    }
    withIntersections.push(currentCoords[currentCoords.length - 1]);
    currentCoords = withIntersections;
  }

  // 3. Si invade el área de otro lote existente, alinear los vértices al borde de ese lote
  for (const existCoords of existingLotsCoords) {
    currentCoords = currentCoords.map((pt, idx) => {
      if (idx === currentCoords.length - 1 && currentCoords.length > 2) return pt;

      if (isPointInPolygon(pt, existCoords)) {
        wasAdapted = true;
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

  // 4. Limpieza de puntos duplicados consecutivos
  const cleaned: Coordinate[] = [];
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

  if (cleaned.length < 3) {
    return { adaptedCoords: loteCoords, wasAdapted: false };
  }

  const first = cleaned[0];
  const last = cleaned[cleaned.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    cleaned.push([first[0], first[1]]);
  }

  return {
    adaptedCoords: cleaned,
    wasAdapted,
    detail: wasAdapted
      ? '✨ Lote adaptado y alineado automáticamente a los límites de la finca y bordes de lotes vecinos.'
      : undefined,
  };
}

/**
 * Requisito 5: Exportar a KML
 * Genera un archivo KML estándar para Google Earth con el perímetro y lotes
 */
export function exportToKML(
  fincaNombre: string,
  perimetroCoords: Coordinate[] | null,
  lotes: Array<{ nombre: string; tipo: string; geometria: any }>
): string {
  const formatCoords = (coords: Coordinate[]) => {
    return coords.map(([lng, lat]) => `${lng},${lat},0`).join(' ');
  };

  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${fincaNombre || 'Finca LODANA'} - Cartografía</name>
    <description>Cartografía Satelital, perímetro y lotes agrícolas y ganaderos de la finca.</description>
    
    <!-- Estilos -->
    <Style id="estiloFinca">
      <LineStyle>
        <color>ffff7800</color>
        <width>3.5</width>
      </LineStyle>
      <PolyStyle>
        <color>33ff7800</color>
      </PolyStyle>
    </Style>

    <Style id="estiloAgricultura">
      <LineStyle>
        <color>ff228b22</color>
        <width>2.5</width>
      </LineStyle>
      <PolyStyle>
        <color>55228b22</color>
      </PolyStyle>
    </Style>

    <Style id="estiloGanaderia">
      <LineStyle>
        <color>ff0080ff</color>
        <width>2.5</width>
      </LineStyle>
      <PolyStyle>
        <color>550080ff</color>
      </PolyStyle>
    </Style>

    <Folder>
      <name>Perímetro de la Finca</name>
`;

  if (perimetroCoords && perimetroCoords.length >= 3) {
    kml += `      <Placemark>
        <name>Perímetro: ${fincaNombre || 'Finca'}</name>
        <styleUrl>#estiloFinca</styleUrl>
        <Polygon>
          <tessellate>1</tessellate>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>${formatCoords(perimetroCoords)}</coordinates>
            </LinearRing>
          </outerBoundaryIs>
        </Polygon>
      </Placemark>
`;
  }

  kml += `    </Folder>

    <Folder>
      <name>Lotes de la Finca</name>
`;

  for (const lote of lotes) {
    const coords = extractPolygonCoordinates(lote.geometria);
    if (!coords) continue;

    const styleUrl = lote.tipo === 'agricultura' ? '#estiloAgricultura' : '#estiloGanaderia';

    kml += `      <Placemark>
        <name>${lote.nombre} (${lote.tipo.toUpperCase()})</name>
        <description>Lote asignado al área de ${lote.tipo}</description>
        <styleUrl>${styleUrl}</styleUrl>
        <Polygon>
          <tessellate>1</tessellate>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>${formatCoords(coords)}</coordinates>
            </LinearRing>
          </outerBoundaryIs>
        </Polygon>
      </Placemark>
`;
  }

  kml += `    </Folder>
  </Document>
</kml>`;

  return kml;
}

/**
 * Requisito 5: Parsear KML / KMZ
 * Extrae polígonos de un string KML o de un ArrayBuffer KMZ
 */
/**
 * Helper para obtener y formatear de qué es el lote (Cacao, Banano, Ganadería, etc.)
 */
export function obtenerDetalleLote(lote: any): {
  rubro: string;
  icono: string;
  subtitulo: string;
  items: string[];
} {
  const nombreLower = (lote?.nombre || '').toLowerCase();

  // 1. Si tiene cultivos asociados
  if (lote?.cultivos && Array.isArray(lote.cultivos) && lote.cultivos.length > 0) {
    const nombres = lote.cultivos.map((c: any) => c.nombre);
    const primer = nombres[0].toLowerCase();
    let icono = '🌱';
    if (primer.includes('cacao')) icono = '🍫';
    else if (primer.includes('banan') || primer.includes('platan') || primer.includes('plátan'))
      icono = '🍌';
    else if (primer.includes('maiz') || primer.includes('maíz')) icono = '🌽';
    else if (primer.includes('cafe') || primer.includes('café')) icono = '☕';
    else if (primer.includes('citrico') || primer.includes('limon') || primer.includes('limón'))
      icono = '🍋';

    return {
      rubro: nombres.join(', '),
      icono,
      subtitulo: `Cultivo asignado (${lote.cultivos.length} registro${
        lote.cultivos.length > 1 ? 's' : ''
      })`,
      items: lote.cultivos.map(
        (c: any) => `${c.nombre} (${c.tipo || 'cultivo'}) - ${c.area || ''} ${c.unidad || ''}`
      ),
    };
  }

  // 2. Si tiene ganado asociado
  if (lote?.ganado && Array.isArray(lote.ganado) && lote.ganado.length > 0) {
    const tipos = [...new Set(lote.ganado.map((g: any) => g.tipo || 'bovino'))];
    return {
      rubro: tipos.map((t: string) => t.toUpperCase()).join(', '),
      icono: '🐄',
      subtitulo: `Ganadería asignada (${lote.ganado.length} cabezas)`,
      items: lote.ganado.map(
        (g: any) => `${g.identificacion} - ${g.tipo} ${g.raza ? `(${g.raza})` : ''}`
      ),
    };
  }

  // 3. Inferir por nombre del lote
  if (nombreLower.includes('cacao')) {
    return { rubro: 'Cacao', icono: '🍫', subtitulo: 'Producción de Cacao', items: [] };
  }
  if (nombreLower.includes('banan')) {
    return { rubro: 'Banano', icono: '🍌', subtitulo: 'Producción de Banano', items: [] };
  }
  if (nombreLower.includes('platan') || nombreLower.includes('plátan')) {
    return { rubro: 'Plátano', icono: '🍌', subtitulo: 'Producción de Plátano', items: [] };
  }
  if (nombreLower.includes('maiz') || nombreLower.includes('maíz')) {
    return { rubro: 'Maíz', icono: '🌽', subtitulo: 'Cultivo de Maíz', items: [] };
  }
  if (nombreLower.includes('cafe') || nombreLower.includes('café')) {
    return { rubro: 'Café', icono: '☕', subtitulo: 'Producción de Café', items: [] };
  }
  if (nombreLower.includes('arroz')) {
    return { rubro: 'Arroz', icono: '🌾', subtitulo: 'Cultivo de Arroz', items: [] };
  }
  if (nombreLower.includes('yuca')) {
    return { rubro: 'Yuca', icono: '🥔', subtitulo: 'Cultivo de Yuca', items: [] };
  }
  if (
    nombreLower.includes('citrico') ||
    nombreLower.includes('cítrico') ||
    nombreLower.includes('limon') ||
    nombreLower.includes('limón')
  ) {
    return { rubro: 'Cítricos / Limón', icono: '🍋', subtitulo: 'Frutales Cítricos', items: [] };
  }
  if (
    nombreLower.includes('pasto') ||
    nombreLower.includes('bovin') ||
    nombreLower.includes('vaca') ||
    nombreLower.includes('ganad') ||
    lote?.tipo === 'ganaderia'
  ) {
    return {
      rubro: 'Ganadería / Pastoreo',
      icono: '🐄',
      subtitulo: 'Área Pecuaria y Pastoreo',
      items: [],
    };
  }

  return {
    rubro: lote?.tipo === 'agricultura' ? 'Agricultura General' : 'Ganadería General',
    icono: lote?.tipo === 'agricultura' ? '🌱' : '🐂',
    subtitulo: lote?.tipo === 'agricultura' ? 'Área Agrícola' : 'Área Pecuaria',
    items: [],
  };
}

export interface ImportedPolygon {
  name: string;
  description?: string;
  coordinates: Coordinate[];
}

export function parseKMLString(kmlString: string): ImportedPolygon[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlString, 'text/xml');
  const placemarks = xmlDoc.getElementsByTagName('Placemark');
  const results: ImportedPolygon[] = [];

  for (let i = 0; i < placemarks.length; i++) {
    const placemark = placemarks[i];
    const nameEl = placemark.getElementsByTagName('name')[0];
    const name = nameEl?.textContent?.trim() || `Polígono ${i + 1}`;

    const descEl = placemark.getElementsByTagName('description')[0];
    const description = descEl?.textContent?.trim();

    // Buscar <Polygon>
    const polygonEl = placemark.getElementsByTagName('Polygon')[0];
    if (!polygonEl) continue;

    const coordsEl = polygonEl.getElementsByTagName('coordinates')[0];
    if (!coordsEl || !coordsEl.textContent) continue;

    const coordsText = coordsEl.textContent.trim();
    const coordinates: Coordinate[] = [];
    const tupleRegex = /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*-?\d+(?:\.\d+)?)?/g;
    let match: RegExpExecArray | null;

    while ((match = tupleRegex.exec(coordsText)) !== null) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      if (!isNaN(lng) && !isNaN(lat)) {
        coordinates.push([lng, lat]);
      }
    }

    if (coordinates.length >= 3) {
      // Cerrar anillo si es necesario
      const first = coordinates[0];
      const last = coordinates[coordinates.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coordinates.push([first[0], first[1]]);
      }

      results.push({
        name,
        description,
        coordinates,
      });
    }
  }

  return results;
}

/**
 * Descomprime un archivo KMZ (formato ZIP) en el navegador sin librerías externas
 * utilizando la API nativa de descompresión o extrayendo el doc.kml
 */
export async function parseKMZBuffer(buffer: ArrayBuffer): Promise<ImportedPolygon[]> {
  const bytes = new Uint8Array(buffer);
  let kmlText = '';

  // Buscar firma de cabecera ZIP: 0x04034b50 ('PK\x03\x04')
  let offset = 0;
  while (offset < bytes.length - 30) {
    if (
      bytes[offset] === 0x50 &&
      bytes[offset + 1] === 0x4b &&
      bytes[offset + 2] === 0x03 &&
      bytes[offset + 3] === 0x04
    ) {
      // Cabecera de archivo local encontrada
      const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
      const compressedSize =
        bytes[offset + 18] |
        (bytes[offset + 19] << 8) |
        (bytes[offset + 20] << 16) |
        (bytes[offset + 21] << 24);
      const fileNameLength = bytes[offset + 26] | (bytes[offset + 27] << 8);
      const extraFieldLength = bytes[offset + 28] | (bytes[offset + 29] << 8);

      const fileNameStart = offset + 30;
      const fileNameBytes = bytes.slice(fileNameStart, fileNameStart + fileNameLength);
      const fileName = new TextDecoder().decode(fileNameBytes);

      const dataStart = fileNameStart + fileNameLength + extraFieldLength;
      const dataEnd = dataStart + compressedSize;

      if (fileName.toLowerCase().endsWith('.kml')) {
        const fileData = bytes.slice(dataStart, dataEnd);

        if (compressionMethod === 0) {
          // Sin compresión (Stored)
          kmlText = new TextDecoder().decode(fileData);
          break;
        } else if (compressionMethod === 8) {
          // Compresión Deflate
          try {
            // Usar DecompressionStream nativo del navegador si está disponible
            if (typeof DecompressionStream !== 'undefined') {
              const ds = new DecompressionStream('deflate-raw');
              const writer = ds.writable.getWriter();
              writer.write(fileData);
              writer.close();
              const decompressed = await new Response(ds.readable).arrayBuffer();
              kmlText = new TextDecoder().decode(decompressed);
              break;
            }
          } catch (e) {
            console.warn('DecompressionStream falló, intentando método alternativo:', e);
          }
        }
      }

      offset = dataEnd;
    } else {
      offset++;
    }
  }

  if (!kmlText) {
    throw new Error('No se pudo encontrar o descomprimir el archivo KML dentro del archivo KMZ.');
  }

  return parseKMLString(kmlText);
}
