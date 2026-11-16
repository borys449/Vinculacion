'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface DrawControlProps {
  modoAccion: 'finca' | 'lote';
  tipoLote: 'agricultura' | 'ganaderia';
  onCreated: (e: any) => void;
  onDeleted: () => void;
}

function LeafletDrawControl({ modoAccion, tipoLote, onCreated, onDeleted }: DrawControlProps) {
  const map = useMap();

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawColor = modoAccion === 'finca' ? '#2563eb' : tipoLote === 'agricultura' ? '#16a34a' : '#ca8a04';

    const drawControl = new (L.Control as any).Draw({
      position: 'topright',
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
      draw: {
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
        polygon: {
          allowIntersection: false,
          showArea: true,
          metric: true,
          shapeOptions: {
            color: drawColor,
            weight: 3,
            fillOpacity: 0.3,
          },
        },
      },
    });

    map.addControl(drawControl);

    const handleCreated = (e: any) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      onCreated(e);
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
  }, [map, modoAccion, tipoLote, onCreated, onDeleted]);

  return null;
}

interface MapaFincaProps {
  fincaId: string;
  perimetroInicial?: any;
  lotesExistentes?: Array<{ id: string | number; nombre: string; tipo: 'agricultura' | 'ganaderia'; geometria: any }>;
  onGuardarPerimetro: (geometria: any) => void;
  onCrearLote: (lote: { nombre: string; tipo: 'agricultura' | 'ganaderia'; geometria: any }) => void;
}

export default function MapaFinca({
  fincaId = '',
  perimetroInicial = null,
  lotesExistentes = [],
  onGuardarPerimetro = () => {},
  onCrearLote = () => {},
}: MapaFincaProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [modoAccion, setModoAccion] = useState<'finca' | 'lote'>('finca');
  const [tipoLote, setTipoLote] = useState<'agricultura' | 'ganaderia'>('agricultura');
  const [nombreLote, setNombreLote] = useState('');
  
  const [geometriaPendiente, setGeometriaPendiente] = useState<any>(null);

  const centroFinca: [number, number] = [-1.1608, -80.3888]; // Lodana

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
      <div className="h-[500px] w-full flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200">
        <p className="text-sm text-gray-500">Cargando mapa interactivo...</p>
      </div>
    );
  }

  const handleCreated = (e: any) => {
    const { layer } = e;
    if (layer) {
      const geoJson = layer.toGeoJSON();
      setGeometriaPendiente(geoJson);
    }
  };

  const handleDeleted = () => {
    setGeometriaPendiente(null);
  };

  const confirmarGuardado = () => {
    if (!geometriaPendiente) {
      alert('Primero debes dibujar el polígono en el mapa usando la herramienta de dibujo (icono de pentágono arriba a la derecha).');
      return;
    }

    if (modoAccion === 'finca') {
      onGuardarPerimetro(geometriaPendiente);
    } else {
      if (!nombreLote.trim()) {
        alert('Por favor, ingresa un nombre para el lote antes de guardarlo.');
        return;
      }
      onCrearLote({
        nombre: nombreLote,
        tipo: tipoLote,
        geometria: geometriaPendiente,
      });
      setNombreLote('');
    }
    setGeometriaPendiente(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Gestión Cartográfica de la Finca</h3>
          <p className="text-xs text-gray-500">
            {modoAccion === 'finca'
              ? 'Usa la herramienta del mapa para trazar el perímetro y haz clic en "Guardar Perímetro".'
              : 'Dibuja el sub-lote, asigna nombre y rama, luego haz clic en "Guardar Lote".'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setModoAccion('finca'); setGeometriaPendiente(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              modoAccion === 'finca' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Trazar Finca
          </button>
          <button
            onClick={() => { setModoAccion('lote'); setGeometriaPendiente(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              modoAccion === 'lote' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Crear Lote
          </button>
        </div>
      </div>

      {modoAccion === 'lote' && (
        <div className="bg-green-50 p-3 rounded-xl border border-green-200 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Nombre del lote (ej. Lote Cacao 1)"
            value={nombreLote}
            onChange={(e) => setNombreLote(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 flex-1"
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
            💡 Consejo: Revisa los lotes existentes para no encimarte.
          </span>
        </div>
      )}

      {geometriaPendiente && (
        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex justify-between items-center animate-pulse">
          <span className="text-xs font-semibold text-blue-900">
            ✨ ¡Polígono trazado correctamente en el mapa! Haz clic en el botón para confirmar.
          </span>
          <button
            onClick={confirmarGuardado}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition"
          >
            {modoAccion === 'finca' ? '💾 Guardar Perímetro de Finca' : '💾 Guardar Lote'}
          </button>
        </div>
      )}

      <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-md border border-gray-200 relative z-0">
        <MapContainer center={centroFinca} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />

          {perimetroInicial && (
            <Polygon
              positions={
                perimetroInicial?.geometry?.coordinates?.[0]?.map((c: any) => [c[1], c[0]]) || []
              }
              pathOptions={{
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 3,
                dashArray: '5, 5'
              }}
            >
              <Popup>
                <div className="text-xs">
                  <strong>Perímetro General de la Finca</strong>
                </div>
              </Popup>
            </Polygon>
          )}

          {lotesExistentes.map((lote) => {
            const coords = lote.geometria?.geometry?.coordinates[0]?.map((c: any) => [c[1], c[0]]) || [];
            const colorLote = lote.tipo === 'agricultura' ? '#16a34a' : '#ca8a04';

            return (
              <Polygon key={lote.id} positions={coords} pathOptions={{ color: colorLote, fillColor: colorLote, fillOpacity: 0.4 }}>
                <Popup>
                  <div className="text-xs">
                    <strong>{lote.nombre}</strong> <br />
                    <span>Tipo: {lote.tipo.toUpperCase()}</span>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          <LeafletDrawControl
            modoAccion={modoAccion}
            tipoLote={tipoLote}
            onCreated={handleCreated}
            onDeleted={handleDeleted}
          />
        </MapContainer>
      </div>
    </div>
  );
}