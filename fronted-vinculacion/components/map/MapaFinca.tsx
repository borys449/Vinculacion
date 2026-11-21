'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

import {
  Coordinate,
  extractPolygonCoordinates,
  toLeafletLatLngs,
  toGeoJsonCoords,
  clampAndAdaptPolygonToFincaAndLotes,
  calculateBoundingBox,
  calculateCentroid,
  exportToKML,
  parseKMLString,
  parseKMZBuffer,
  ImportedPolygon,
} from '@/utils/geoSpatial';

interface DrawControlProps {
  modoAccion: 'finca' | 'lote' | 'modificar';
  tipoLote: 'agricultura' | 'ganaderia';
  perimetroCoords: Coordinate[] | null;
  lotesExistentes: Array<{
    id: string | number;
    nombre: string;
    tipo: 'agricultura' | 'ganaderia';
    geometria: any;
  }>;
  onCreated: (geoJson: any, wasAdapted: boolean) => void;
  onDeleted: () => void;
}

/**
 * Control de dibujo Leaflet Draw (deshabilitado cuando estamos modificando polígonos)
 */
function LeafletDrawControl({
  modoAccion,
  tipoLote,
  perimetroCoords,
  lotesExistentes,
  onCreated,
  onDeleted,
}: DrawControlProps) {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    drawnItemsRef.current = drawnItems;
    map.addLayer(drawnItems);

    const drawColor =
      modoAccion === 'finca' ? '#2563eb' : tipoLote === 'agricultura' ? '#16a34a' : '#ca8a04';

    const drawControl = new (L.Control as any).Draw({
      position: 'topright',
      edit: {
        featureGroup: drawnItems,
        remove: false,
        edit: false,
      },
      draw: {
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
        polygon:
          modoAccion === 'modificar'
            ? false
            : {
                allowIntersection: false,
                showArea: true,
                metric: true,
                shapeOptions: {
                  color: drawColor,
                  weight: 3,
                  fillOpacity: 0.35,
                },
              },
      },
    });

    map.addControl(drawControl);

    const handleCreated = (e: any) => {
      drawnItems.clearLayers();
      const layer = e.layer;
      let geoJson = layer.toGeoJSON();
      let wasAdapted = false;

      const rawCoords = extractPolygonCoordinates(geoJson);
      if (rawCoords) {
        if (modoAccion === 'lote') {
          const result = clampAndAdaptPolygonToFincaAndLotes(
            rawCoords,
            perimetroCoords,
            lotesExistentes
          );
          wasAdapted = result.wasAdapted;

          geoJson = {
            type: 'Feature',
            properties: geoJson.properties || {},
            geometry: {
              type: 'Polygon',
              coordinates: [result.adaptedCoords],
            },
          };

          const adaptedLatLngs = toLeafletLatLngs(result.adaptedCoords);
          const adaptedPoly = L.polygon(adaptedLatLngs, {
            color: drawColor,
            weight: 3,
            fillOpacity: 0.4,
          });
          drawnItems.addLayer(adaptedPoly);
        } else {
          drawnItems.addLayer(layer);
        }
      } else {
        drawnItems.addLayer(layer);
      }

      onCreated(geoJson, wasAdapted);
    };

    const handleDeleted = () => {
      onDeleted();
    };

    map.on((L as any).Draw.Event.CREATED, handleCreated);
    map.on((L as any).Draw.Event.DELETED, handleDeleted);

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
      map.off((L as any).Draw.Event.CREATED, handleCreated);
      map.off((L as any).Draw.Event.DELETED, handleDeleted);
    };
  }, [map, modoAccion, tipoLote, perimetroCoords, lotesExistentes, onCreated, onDeleted]);

  return null;
}

/**
 * Editor Interactivo en Tiempo Real de Vértices y Puntos Medios (+)
 * - Redibuja el polígono EN VIVO durante el arrastre de cualquier punto
 * - Provee marcadores con el signo '+' en los puntos medios para agregar nuevos vértices fácilmente
 * - Permite eliminar puntos haciendo clic secundario o clic en el vértice
 */
interface RealtimePolygonEditorProps {
  editandoTarget: { tipo: 'finca' | 'lote'; id?: string | number; coords: Coordinate[] } | null;
  onUpdateCoords: (coords: Coordinate[]) => void;
}

function RealtimePolygonEditor({ editandoTarget, onUpdateCoords }: RealtimePolygonEditorProps) {
  const map = useMap();
  const [currentLatLngs, setCurrentLatLngs] = useState<[number, number][]>([]);

  useEffect(() => {
    if (editandoTarget && editandoTarget.coords && editandoTarget.coords.length >= 3) {
      setCurrentLatLngs(toLeafletLatLngs(editandoTarget.coords));
    } else {
      setCurrentLatLngs([]);
    }
  }, [editandoTarget]);

  const polyLayerRef = useRef<L.Polygon | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Re-dibujar polígono y marcadores interactivos en tiempo real
  useEffect(() => {
    if (!editandoTarget || currentLatLngs.length < 3) {
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
      return;
    }

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    const group = layerGroupRef.current;
    group.clearLayers();

    // 1. Polígono con bordes y relleno dinámico
    const poly = L.polygon(currentLatLngs, {
      color: '#3b82f6',
      weight: 3.5,
      fillColor: '#60a5fa',
      fillOpacity: 0.35,
      dashArray: '6, 6',
    });
    group.addLayer(poly);
    polyLayerRef.current = poly;

    // Número de vértices reales (excluyendo el punto repetido final si existe)
    const pts =
      currentLatLngs[0][0] === currentLatLngs[currentLatLngs.length - 1][0] &&
      currentLatLngs[0][1] === currentLatLngs[currentLatLngs.length - 1][1]
        ? currentLatLngs.slice(0, currentLatLngs.length - 1)
        : currentLatLngs;

    // 2. Marcadores en cada vértice arrastrable en tiempo real
    pts.forEach((pt, index) => {
      const vertexIcon = L.divIcon({
        className: 'custom-vertex-handle',
        html: `<div style="width:16px;height:16px;background:#ffffff;border:3px solid #2563eb;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);cursor:grab;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker(pt, {
        icon: vertexIcon,
        draggable: true,
        zIndexOffset: 1000,
      });

      // Actualización en tiempo real durante el arrastre (LIVE 60fps)
      marker.on('drag', (e: any) => {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        const updated = [...currentLatLngs];
        updated[index] = newPos;

        // Si es el primer vértice, sincronizar también el punto de cierre
        if (index === 0 && updated.length > 2) {
          updated[updated.length - 1] = newPos;
        }

        poly.setLatLngs(updated);
      });

      // Confirmar cambio de coordenadas al soltar el vértice
      marker.on('dragend', (e: any) => {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        const updated = [...currentLatLngs];
        updated[index] = newPos;
        if (index === 0 && updated.length > 2) {
          updated[updated.length - 1] = newPos;
        }

        setCurrentLatLngs(updated);
        onUpdateCoords(toGeoJsonCoords(updated));
      });

      // Opción de eliminar vértice con clic si hay más de 3 vértices
      marker.on('contextmenu', () => {
        if (pts.length > 3) {
          const updated = pts.filter((_, i) => i !== index);
          updated.push([updated[0][0], updated[0][1]]);
          setCurrentLatLngs(updated);
          onUpdateCoords(toGeoJsonCoords(updated));
        } else {
          alert('Un polígono debe tener al menos 3 vértices.');
        }
      });

      marker.bindTooltip(`Vértice ${index + 1} (Clic derecho para eliminar)`, {
        direction: 'top',
        offset: [0, -10],
      });

      group.addLayer(marker);

      // 3. Marcador de punto medio (+) para agregar nuevos vértices fácilmente
      const nextIndex = (index + 1) % pts.length;
      const nextPt = pts[nextIndex];
      const midPoint: [number, number] = [(pt[0] + nextPt[0]) / 2, (pt[1] + nextPt[1]) / 2];

      const plusIcon = L.divIcon({
        className: 'custom-midpoint-add',
        html: `<div title="Haz clic para agregar un nuevo punto aquí" style="width:20px;height:20px;background:#10b981;border:2px solid #ffffff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:13px;font-weight:bold;cursor:pointer;line-height:1;transition:transform 0.15s ease;">+</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const midMarker = L.marker(midPoint, {
        icon: plusIcon,
        draggable: true,
        zIndexOffset: 500,
      });

      // Al hacer clic en el '+', se inserta el nuevo vértice
      midMarker.on('click', () => {
        const newPts = [...pts];
        newPts.splice(index + 1, 0, midPoint);
        newPts.push([newPts[0][0], newPts[0][1]]);
        setCurrentLatLngs(newPts);
        onUpdateCoords(toGeoJsonCoords(newPts));
      });

      // Al arrastrar el '+', se convierte directamente en un nuevo vértice dinámico
      midMarker.on('drag', (e: any) => {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        const previewPts = [...pts];
        previewPts.splice(index + 1, 0, newPos);
        previewPts.push([previewPts[0][0], previewPts[0][1]]);
        poly.setLatLngs(previewPts);
      });

      midMarker.on('dragend', (e: any) => {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        const newPts = [...pts];
        newPts.splice(index + 1, 0, newPos);
        newPts.push([newPts[0][0], newPts[0][1]]);
        setCurrentLatLngs(newPts);
        onUpdateCoords(toGeoJsonCoords(newPts));
      });

      group.addLayer(midMarker);
    });

    return () => {
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
    };
  }, [map, editandoTarget, currentLatLngs, onUpdateCoords]);

  return null;
}

/**
 * Controlador de vistas y centrado en la finca
 */
interface MapViewControllerProps {
  fincaId: string;
  perimetroCoords: Coordinate[] | null;
  triggerIrAFinca: number;
  poligonosImportadosCoords: Coordinate[][] | null;
}

function MapViewController({
  fincaId,
  perimetroCoords,
  triggerIrAFinca,
  poligonosImportadosCoords,
}: MapViewControllerProps) {
  const map = useMap();

  const centrarEnFinca = useCallback(() => {
    if (perimetroCoords && perimetroCoords.length >= 3) {
      const bbox = calculateBoundingBox(perimetroCoords);
      const bounds = L.latLngBounds([bbox.minLat, bbox.minLng], [bbox.maxLat, bbox.maxLng]);
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.2, maxZoom: 16 });
    } else {
      const guardado = localStorage.getItem(`finca_principal_bounds_${fincaId}`);
      if (guardado) {
        try {
          const bbox = JSON.parse(guardado);
          const bounds = L.latLngBounds([bbox.minLat, bbox.minLng], [bbox.maxLat, bbox.maxLng]);
          map.flyToBounds(bounds, { padding: [50, 50], duration: 1.2, maxZoom: 16 });
          return;
        } catch (e) {
          console.error(e);
        }
      }
      map.flyTo([-1.1608, -80.3888], 15, { duration: 1.2 });
    }
  }, [map, perimetroCoords, fincaId]);

  useEffect(() => {
    if (triggerIrAFinca > 0) {
      centrarEnFinca();
    }
  }, [triggerIrAFinca, centrarEnFinca]);

  useEffect(() => {
    if (perimetroCoords && perimetroCoords.length >= 3) {
      const bbox = calculateBoundingBox(perimetroCoords);
      const bounds = L.latLngBounds([bbox.minLat, bbox.minLng], [bbox.maxLat, bbox.maxLng]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      localStorage.setItem(`finca_principal_bounds_${fincaId}`, JSON.stringify(bbox));
    }
  }, [map, perimetroCoords, fincaId]);

  useEffect(() => {
    if (poligonosImportadosCoords && poligonosImportadosCoords.length > 0) {
      const allPoints: Coordinate[] = poligonosImportadosCoords.flat();
      if (allPoints.length >= 3) {
        const bbox = calculateBoundingBox(allPoints);
        const bounds = L.latLngBounds([bbox.minLat, bbox.minLng], [bbox.maxLat, bbox.maxLng]);
        map.flyToBounds(bounds, { padding: [60, 60], duration: 1.2, maxZoom: 14 });
      }
    }
  }, [map, poligonosImportadosCoords]);

  return null;
}

interface MapaFincaProps {
  fincaId: string;
  nombreFinca?: string;
  perimetroInicial?: any;
  lotesExistentes?: Array<{
    id: string | number;
    nombre: string;
    tipo: 'agricultura' | 'ganaderia';
    geometria: any;
  }>;
  onGuardarPerimetro: (geometria: any) => void;
  onCrearLote: (lote: { nombre: string; tipo: 'agricultura' | 'ganaderia'; geometria: any }) => void;
  onActualizarLote?: (id: number, data: Partial<any>) => void;
  onEliminarMapaCompleto?: () => void;
}

export default function MapaFinca({
  fincaId = '',
  nombreFinca = 'Mi Finca',
  perimetroInicial = null,
  lotesExistentes = [],
  onGuardarPerimetro = () => {},
  onCrearLote = () => {},
  onActualizarLote = () => {},
  onEliminarMapaCompleto = () => {},
}: MapaFincaProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [modoAccion, setModoAccion] = useState<'finca' | 'lote' | 'modificar'>('finca');
  const [tipoLote, setTipoLote] = useState<'agricultura' | 'ganaderia'>('agricultura');
  const [nombreLote, setNombreLote] = useState('');

  // Polígono activo en modificación en tiempo real
  const [editandoTarget, setEditandoTarget] = useState<{
    tipo: 'finca' | 'lote';
    id?: string | number;
    nombre?: string;
    coords: Coordinate[];
  } | null>(null);

  const [geometriaPendiente, setGeometriaPendiente] = useState<any>(null);
  const [fueAdaptado, setFueAdaptado] = useState(false);

  const [triggerIrAFinca, setTriggerIrAFinca] = useState(0);

  // Archivo importado KML / KMZ
  const [archivoImportado, setArchivoImportado] = useState<{
    nombre: string;
    poligonos: ImportedPolygon[];
  } | null>(null);
  const [cargandoArchivo, setCargandoArchivo] = useState(false);

  const perimetroCoords = useMemo(() => {
    return extractPolygonCoordinates(perimetroInicial);
  }, [perimetroInicial]);

  const poligonosImportadosCoords = useMemo(() => {
    if (!archivoImportado) return null;
    return archivoImportado.poligonos.map((p) => p.coordinates);
  }, [archivoImportado]);

  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: iconRetinaUrl.src || iconRetinaUrl,
      iconUrl: iconUrl.src || iconUrl,
      shadowUrl: shadowUrl.src || shadowUrl,
    });
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[550px] w-full flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200">
        <p className="text-sm text-gray-500">Cargando visor satelital interactivo...</p>
      </div>
    );
  }

  const handleCreated = (geoJson: any, wasAdapted: boolean) => {
    setGeometriaPendiente(geoJson);
    setFueAdaptado(wasAdapted);
    setEditandoTarget(null);
  };

  const handleDeleted = () => {
    setGeometriaPendiente(null);
    setFueAdaptado(false);
  };

  // Iniciar modificación en tiempo real del perímetro
  const iniciarModificarPerimetro = () => {
    if (!perimetroCoords || perimetroCoords.length < 3) {
      alert('Primero debes trazar y guardar el perímetro de la finca para poder modificarlo.');
      return;
    }
    setModoAccion('modificar');
    setEditandoTarget({
      tipo: 'finca',
      nombre: 'Perímetro de la Finca',
      coords: perimetroCoords,
    });
    setGeometriaPendiente({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [perimetroCoords],
      },
    });
  };

  // Iniciar modificación en tiempo real de un lote
  const iniciarModificarLote = (lote: any) => {
    const coords = extractPolygonCoordinates(lote.geometria);
    if (!coords) return;

    setModoAccion('modificar');
    setEditandoTarget({
      tipo: 'lote',
      id: lote.id,
      nombre: lote.nombre,
      coords,
    });
    setGeometriaPendiente({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
    });
  };

  // Actualización de coordenadas vivas
  const handleUpdateCoords = (coords: Coordinate[]) => {
    const geoJson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
    };
    setGeometriaPendiente(geoJson);
  };

  // Guardar cambios del polígono modificado
  const confirmarGuardado = () => {
    if (!geometriaPendiente) {
      alert('Dibuja o modifica un polígono antes de guardar.');
      return;
    }

    if (modoAccion === 'modificar' && editandoTarget) {
      if (editandoTarget.tipo === 'finca') {
        onGuardarPerimetro(geometriaPendiente);
      } else if (editandoTarget.tipo === 'lote' && editandoTarget.id) {
        onActualizarLote(Number(editandoTarget.id), {
          geometria: geometriaPendiente,
        });
      }
      setEditandoTarget(null);
      setModoAccion('finca');
    } else if (modoAccion === 'finca') {
      onGuardarPerimetro(geometriaPendiente);
    } else {
      if (!nombreLote.trim()) {
        alert('Por favor, ingresa un nombre para el lote antes de guardarlo.');
        return;
      }
      onCrearLote({
        nombre: nombreLote.trim(),
        tipo: tipoLote,
        geometria: geometriaPendiente,
      });
      setNombreLote('');
    }

    setGeometriaPendiente(null);
    setFueAdaptado(false);
  };

  const cancelarModificacion = () => {
    setEditandoTarget(null);
    setGeometriaPendiente(null);
    setModoAccion('finca');
  };

  // Requisito: Borrar mapa completo con confirmación mediante el icono en la esquina del mapa
  const handleEliminarMapaCompleto = () => {
    const confirmado = window.confirm(
      '¿Está seguro de eliminar el mapa completo de la finca?\n\n' +
        '⚠️ ATENCIÓN: Esta acción eliminará permanentemente el perímetro y TODOS los lotes agrícolas y ganaderos asociados para que pueda trazar todo desde cero.'
    );
    if (confirmado) {
      onEliminarMapaCompleto();
      setGeometriaPendiente(null);
      setEditandoTarget(null);
      setModoAccion('finca');
      setTriggerIrAFinca((prev) => prev + 1);
    }
  };

  const handleExportarKML = () => {
    const kmlContent = exportToKML(nombreFinca, perimetroCoords, lotesExistentes);
    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreFinca.toLowerCase().replace(/\s+/g, '_')}_cartografia.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleArchivoSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCargandoArchivo(true);
      const fileName = file.name;
      const lower = fileName.toLowerCase();

      let poligonos: ImportedPolygon[] = [];

      if (lower.endsWith('.kmz')) {
        const buffer = await file.arrayBuffer();
        poligonos = await parseKMZBuffer(buffer);
      } else if (lower.endsWith('.kml') || lower.endsWith('.xml')) {
        const text = await file.text();
        poligonos = parseKMLString(text);
      } else {
        alert('Formato no soportado. Selecciona un archivo .kml, .kmz o .xml de Google Earth.');
        return;
      }

      if (poligonos.length === 0) {
        alert('No se encontraron polígonos válidos en el archivo seleccionado.');
        return;
      }

      setArchivoImportado({
        nombre: fileName,
        poligonos,
      });
    } catch (err: any) {
      console.error(err);
      alert('Error al leer el archivo: ' + (err.message || 'Archivo corrupto o incompatible'));
    } finally {
      setCargandoArchivo(false);
      e.target.value = '';
    }
  };

  const handleQuitarArchivoImportado = () => {
    setArchivoImportado(null);
    setTriggerIrAFinca((prev) => prev + 1);
  };

  const aplicarPoligonoImportado = (
    poly: ImportedPolygon,
    destino: 'finca' | 'lote',
    tipo: 'agricultura' | 'ganaderia' = 'agricultura'
  ) => {
    const geoJson = {
      type: 'Feature',
      properties: { name: poly.name },
      geometry: {
        type: 'Polygon',
        coordinates: [poly.coordinates],
      },
    };

    if (destino === 'finca') {
      setModoAccion('finca');
      setGeometriaPendiente(geoJson);
      onGuardarPerimetro(geoJson);
    } else {
      setModoAccion('lote');
      setTipoLote(tipo);
      setNombreLote(poly.name);
      setGeometriaPendiente(geoJson);
    }
  };

  const centroInicial: [number, number] = perimetroCoords
    ? [calculateCentroid(perimetroCoords)[1], calculateCentroid(perimetroCoords)[0]]
    : [-1.1608, -80.3888];

  return (
    <div className="space-y-4">
      {/* Barra de Controles y Herramientas */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Gestión Cartográfica de la Finca</h3>
          <p className="text-xs text-gray-500">
            {modoAccion === 'modificar'
              ? 'Arrastra los puntos azules o el botón verde (+) para agregar nuevos vértices en tiempo real.'
              : modoAccion === 'finca'
                ? 'Traza el perímetro general o selecciona modificar para ajustar los límites.'
                : 'Dibuja con auto-alineación: el lote se adaptará al borde de la finca y lotes vecinos sin bloquearse.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de modo */}
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => {
                setModoAccion('finca');
                setGeometriaPendiente(null);
                setEditandoTarget(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                modoAccion === 'finca'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Perímetro Finca
            </button>
            <button
              onClick={() => {
                setModoAccion('lote');
                setGeometriaPendiente(null);
                setEditandoTarget(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                modoAccion === 'lote'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Crear Lote
            </button>
            {perimetroCoords && (
              <button
                onClick={iniciarModificarPerimetro}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
                  modoAccion === 'modificar'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                ✏️ Modificar Polígonos
              </button>
            )}
          </div>

          {/* Importar KML / KMZ */}
          <label className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer flex items-center gap-1 shadow-sm transition">
            <span>📥 {cargandoArchivo ? 'Cargando...' : 'Importar KML/KMZ'}</span>
            <input
              type="file"
              accept=".kml,.kmz,.xml"
              onChange={handleArchivoSeleccionado}
              className="hidden"
              disabled={cargandoArchivo}
            />
          </label>

          {/* Exportar KML */}
          <button
            onClick={handleExportarKML}
            title="Exportar mapa y lotes a formato Google Earth KML"
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition flex items-center gap-1"
          >
            <span>📤 Exportar KML</span>
          </button>
        </div>
      </div>

      {/* Formulario de lote */}
      {modoAccion === 'lote' && (
        <div className="bg-green-50 p-3 rounded-xl border border-green-200 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Nombre del lote (ej. Lote Cacao 1)"
            value={nombreLote}
            onChange={(e) => setNombreLote(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 flex-1 min-w-[200px]"
          />
          <select
            value={tipoLote}
            onChange={(e) => setTipoLote(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="agricultura">Rama: Agricultura</option>
            <option value="ganaderia">Rama: Ganadería</option>
          </select>
          <span className="text-[11px] text-green-800 font-medium">
            💡 Dibuja libremente: si se sale o toca otros lotes, se pegará automáticamente al borde.
          </span>
        </div>
      )}

      {/* Barra de Confirmación cuando hay geometría pendiente o en modificación */}
      {geometriaPendiente && (
        <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-900">
            <span className="text-base">
              {modoAccion === 'modificar' ? '✏️' : '✨'}
            </span>
            <div>
              {modoAccion === 'modificar' ? (
                <span>
                  <strong>Ajustando {editandoTarget?.nombre || 'polígono'} en tiempo real:</strong>{' '}
                  Arrastra los puntos azules para moverlos o haz clic en los <strong>(+)</strong> verdes
                  para agregar nuevos vértices. Haz clic en Guardar al finalizar.
                </span>
              ) : fueAdaptado ? (
                <span>
                  <strong>Lote adaptado al borde:</strong> Se corrigieron automáticamente los puntos
                  exteriores o solapados para encajar perfectamente con la finca y lotes vecinos.
                </span>
              ) : (
                <span>
                  <strong>Polígono listo:</strong> Trazado con éxito. Haz clic en guardar para
                  registrar.
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {modoAccion === 'modificar' && (
              <button
                onClick={cancelarModificacion}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg transition"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={confirmarGuardado}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition"
            >
              💾 Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {/* Contenedor del Mapa Satelital */}
      <div className="h-[550px] w-full rounded-xl overflow-hidden shadow-md border border-gray-200 relative z-0">
        {/* Esquina Superior Izquierda: Botón "Ir a mi finca" + Icono Papelera para Borrar Mapa */}
        <div className="absolute top-4 left-14 z-[1000] flex items-center gap-2">
          <button
            onClick={() => setTriggerIrAFinca((prev) => prev + 1)}
            title="Centrar directamente en el perímetro guardado de la finca (sin GPS)"
            className="px-3.5 py-2 bg-white/95 hover:bg-white text-gray-800 text-xs font-bold rounded-lg shadow-lg border border-gray-300 flex items-center gap-2 transition hover:scale-105 active:scale-95 backdrop-blur-sm"
          >
            <span className="text-base text-red-600">📍</span>
            <span>Ir a mi finca</span>
          </button>

          {/* Requisito: Icono de papelera en la esquina para borrar mapa con confirmación */}
          {perimetroCoords && (
            <button
              onClick={handleEliminarMapaCompleto}
              title="Borrar mapa completo y todos los lotes para empezar desde cero"
              className="p-2 bg-white/95 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg shadow-lg border border-gray-300 hover:border-red-300 transition hover:scale-105 active:scale-95 flex items-center justify-center backdrop-blur-sm"
            >
              <span className="text-base">🗑️</span>
            </button>
          )}
        </div>

        {/* Esquina Inferior Derecha: Cápsula discreta para quitar archivo KML/XML importado */}
        {archivoImportado && (
          <div className="absolute bottom-4 right-4 z-[1000] flex items-center bg-cyan-950/90 hover:bg-cyan-950 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg border border-cyan-400/40 backdrop-blur-sm gap-2">
            <span className="font-mono text-[11px] truncate max-w-[180px]">
              📁 {archivoImportado.nombre}
            </span>
            <button
              onClick={handleQuitarArchivoImportado}
              title="Quitar archivo importado y volver al mapa normal"
              className="text-cyan-200 hover:text-white font-bold ml-1 bg-cyan-800/80 hover:bg-red-600 px-2 py-0.5 rounded transition text-[11px]"
            >
              ✕ Quitar
            </button>
          </div>
        )}

        {/* Etiqueta estética limpia en esquina inferior izquierda */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-black/70 text-white text-[11px] px-3 py-1 rounded-md pointer-events-none backdrop-blur-xs shadow">
          🛰️ Lodana, Manabí
        </div>

        <MapContainer
          center={centroInicial}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Capa 1: Satelital de alta resolución (Esri World Imagery) */}
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />

          {/* Capa 2: Referencias geográficas, cantones y ciudades (Manta, Montecristi, Portoviejo, etc.) */}
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri Labels</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          />

          {/* Perímetro guardado de la finca (oculto si se está editando activamente para evitar duplicados) */}
          {perimetroCoords && !(editandoTarget && editandoTarget.tipo === 'finca') && (
            <Polygon
              positions={toLeafletLatLngs(perimetroCoords)}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.12,
                weight: 3.5,
                dashArray: '6, 6',
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <strong className="text-blue-700">Perímetro General: {nombreFinca}</strong>
                  <br />
                  <span className="text-gray-500">Límite oficial de la propiedad</span>
                  <div className="pt-2">
                    <button
                      onClick={iniciarModificarPerimetro}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded transition w-full"
                    >
                      ✏️ Modificar Vértices del Perímetro
                    </button>
                  </div>
                </div>
              </Popup>
            </Polygon>
          )}

          {/* Lotes existentes de agricultura y ganadería */}
          {lotesExistentes.map((lote) => {
            if (editandoTarget && editandoTarget.tipo === 'lote' && editandoTarget.id === lote.id) {
              return null;
            }
            const coords = extractPolygonCoordinates(lote.geometria);
            if (!coords) return null;
            const latLngs = toLeafletLatLngs(coords);
            const colorLote = lote.tipo === 'agricultura' ? '#16a34a' : '#ca8a04';

            return (
              <Polygon
                key={lote.id}
                positions={latLngs}
                pathOptions={{
                  color: colorLote,
                  fillColor: colorLote,
                  fillOpacity: 0.45,
                  weight: 2.5,
                }}
                eventHandlers={{
                  click: () => {
                    if (modoAccion === 'modificar') {
                      iniciarModificarLote(lote);
                    }
                  },
                }}
              >
                <Popup>
                  <div className="text-xs font-bold text-gray-900 text-center py-0.5 px-1">
                    {lote.nombre}
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {/* Polígonos de Archivo KML/KMZ Importado sobrepuestos sobre el mapa base */}
          {archivoImportado?.poligonos.map((poly, idx) => (
            <Polygon
              key={`kml-${idx}`}
              positions={toLeafletLatLngs(poly.coordinates)}
              pathOptions={{
                color: '#06b6d4',
                fillColor: '#22d3ee',
                fillOpacity: 0.3,
                weight: 3,
                dashArray: '4, 4',
              }}
            >
              <Popup>
                <div className="text-xs space-y-2 p-1">
                  <div>
                    <strong className="text-cyan-900 font-bold">{poly.name}</strong>
                    <div className="text-[10px] text-gray-500">
                      Importado de {archivoImportado.nombre} ({poly.coordinates.length - 1} vértices)
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 pt-1 border-t border-gray-200">
                    <button
                      onClick={() => aplicarPoligonoImportado(poly, 'finca')}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded transition"
                    >
                      🏞️ Usar como Perímetro de Finca
                    </button>
                    <button
                      onClick={() => aplicarPoligonoImportado(poly, 'lote', 'agricultura')}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded transition"
                    >
                      🌱 Guardar como Lote Agrícola
                    </button>
                    <button
                      onClick={() => aplicarPoligonoImportado(poly, 'lote', 'ganaderia')}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded transition"
                    >
                      🐂 Guardar como Lote Ganadero
                    </button>
                  </div>
                </div>
              </Popup>
            </Polygon>
          ))}

          {/* Editor de Vértices y Puntos Medios (+) en Tiempo Real */}
          <RealtimePolygonEditor
            editandoTarget={editandoTarget}
            onUpdateCoords={handleUpdateCoords}
          />

          {/* Controlador de vistas */}
          <MapViewController
            fincaId={fincaId}
            perimetroCoords={perimetroCoords}
            triggerIrAFinca={triggerIrAFinca}
            poligonosImportadosCoords={poligonosImportadosCoords}
          />

          {/* Control de dibujo */}
          <LeafletDrawControl
            modoAccion={modoAccion}
            tipoLote={tipoLote}
            perimetroCoords={perimetroCoords}
            lotesExistentes={lotesExistentes}
            onCreated={handleCreated}
            onDeleted={handleDeleted}
          />
        </MapContainer>
      </div>
    </div>
  );
}
