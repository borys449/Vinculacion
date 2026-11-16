// Declaración para permitir la importación de archivos CSS de Leaflet en TypeScript
declare module 'leaflet/dist/leaflet.css';
declare module 'leaflet-draw/dist/leaflet.draw.css';

// Declaración para el módulo leaflet-draw que no siempre trae tipos nativos actualizados
declare module 'leaflet-draw';